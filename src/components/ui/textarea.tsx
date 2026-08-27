import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    /* guscio per il tratto disegnato — vedi ui/input.tsx */
    <div className="campo-guscio relative w-full min-w-0">
      <textarea
      className={cn(
        // Stesso incavo dell'Input (vedi ui/input.tsx)
        "flex min-h-[110px] w-full rounded-xl border border-input bg-field px-4 py-3 text-base ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring focus-visible:bg-card disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
        ref={ref}
        {...props}
      />
    </div>
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
