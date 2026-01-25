import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface PendingReview {
  applicationId: string;
  jobId: string;
  employerId: string;
  employerName: string;
  jobTitle: string;
}

export function ReviewPrompt() {
  const { user } = useAuth();
  const { isWorker, hasLoaded } = useUser();
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkPendingReviews = async () => {
      if (!user || !hasLoaded || !isWorker) return;

      try {
        // Find completed applications that haven't been reviewed
        const { data, error } = await supabase
          .from("applications")
          .select(`
            id,
            job_id,
            jobs!inner (
              id,
              title,
              owner_id,
              profiles!inner (
                id,
                full_name
              )
            )
          `)
          .eq("applicant_id", user.id)
          .eq("status", "completed")
          .eq("is_reviewed", false)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error checking pending reviews:", error);
          return;
        }

        if (data && data.jobs) {
          const jobData = data.jobs as unknown as {
            id: string;
            title: string;
            owner_id: string;
            profiles: { id: string; full_name: string | null };
          };

          setPendingReview({
            applicationId: data.id,
            jobId: jobData.id,
            employerId: jobData.owner_id,
            employerName: jobData.profiles?.full_name || "l'attività",
            jobTitle: jobData.title,
          });
          setIsOpen(true);

          // Fire confetti!
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#f97316", "#3b82f6", "#22c55e", "#eab308"],
            });
          }, 300);
        }
      } catch (error) {
        console.error("Error checking pending reviews:", error);
      }
    };

    checkPendingReviews();
  }, [user, hasLoaded, isWorker]);

  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    const newRating = isHalf ? starIndex + 0.5 : starIndex + 1;
    setRating(newRating);
  };

  const handleStarHover = (starIndex: number, isHalf: boolean) => {
    const newHover = isHalf ? starIndex + 0.5 : starIndex + 1;
    setHoverRating(newHover);
  };

  const handleSubmit = async () => {
    if (!pendingReview || rating === 0 || !user) return;

    setIsSubmitting(true);
    try {
      // Insert review
      const { error: reviewError } = await supabase.from("reviews").insert({
        job_id: pendingReview.jobId,
        worker_id: user.id,
        employer_id: pendingReview.employerId,
        rating: rating,
        comment: comment.trim() || null,
      });

      if (reviewError) throw reviewError;

      // Mark application as reviewed
      const { error: updateError } = await supabase
        .from("applications")
        .update({ is_reviewed: true })
        .eq("id", pendingReview.applicationId);

      if (updateError) throw updateError;

      toast.success("Grazie per il feedback!", { duration: 2000 });
      setIsOpen(false);
      setPendingReview(null);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Errore nell'invio della recensione", { duration: 2000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  if (!pendingReview) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl">Complimenti! 🎉</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Hai completato il tuo impiego con{" "}
            <span className="font-semibold text-foreground">
              {pendingReview.employerName}
            </span>
            . Come valuti la tua esperienza?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex justify-center gap-1">
            {[0, 1, 2, 3, 4].map((starIndex) => {
              const filled = displayRating >= starIndex + 1;
              const halfFilled =
                displayRating >= starIndex + 0.5 && displayRating < starIndex + 1;

              return (
                <div
                  key={starIndex}
                  className="relative w-10 h-10 cursor-pointer"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {/* Left half (for 0.5 increments) */}
                  <div
                    className="absolute inset-y-0 left-0 w-1/2 z-10"
                    onMouseEnter={() => handleStarHover(starIndex, true)}
                    onClick={() => handleStarClick(starIndex, true)}
                  />
                  {/* Right half */}
                  <div
                    className="absolute inset-y-0 right-0 w-1/2 z-10"
                    onMouseEnter={() => handleStarHover(starIndex, false)}
                    onClick={() => handleStarClick(starIndex, false)}
                  />
                  
                  {/* Star display */}
                  <div className="relative w-full h-full">
                    {/* Empty star background */}
                    <Star className="absolute inset-0 w-full h-full text-muted-foreground/30" />
                    
                    {/* Filled portion */}
                    {(filled || halfFilled) && (
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: halfFilled ? "50%" : "100%" }}
                      >
                        <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {rating > 0 ? `${rating} su 5 stelle` : "Clicca per valutare"}
          </p>

          {/* Comment */}
          <div>
            <Textarea
              placeholder="Scrivi una recensione (opzionale)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Invio...
              </>
            ) : (
              "Invia Recensione"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
