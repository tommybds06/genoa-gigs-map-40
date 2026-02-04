import { useState } from "react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { CheckCheck, Reply } from "lucide-react";

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  reply_to_id: string | null;
  attachment_url: string | null;
  reply_to?: Message | null;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isEmployer: boolean;
  onReply: (message: Message) => void;
  formatTime: (dateString: string) => string;
}

const SWIPE_THRESHOLD = 50; // px needed to trigger reply

export const MessageBubble = ({ 
  message, 
  isOwn, 
  isEmployer, 
  onReply,
  formatTime 
}: MessageBubbleProps) => {
  const [showReplyIcon, setShowReplyIcon] = useState(false);
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  // Reply icon transforms based on swipe distance
  const replyIconOpacity = useTransform(x, [0, 30, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const replyIconScale = useTransform(x, [0, 30, SWIPE_THRESHOLD], [0.5, 0.8, 1]);

  // Dynamic colors based on role
  const getBubbleColors = () => {
    if (isOwn) {
      return isEmployer
        ? "bg-blue-600 text-white rounded-br-sm"
        : "bg-primary text-primary-foreground rounded-br-sm";
    }
    return "bg-muted text-foreground rounded-bl-sm";
  };

  const getTimestampColors = () => {
    if (isOwn) {
      return isEmployer ? "text-blue-200" : "text-primary-foreground/70";
    }
    return "text-muted-foreground";
  };

  const getCheckColors = () => {
    if (!isOwn) return "";
    
    if (message.is_read) {
      // Read: Blue for workers, Yellow for employers (contrast on blue)
      return isEmployer ? "text-yellow-400" : "text-blue-500";
    }
    // Unread: Gray
    return "text-gray-400";
  };

  const getReplyPreviewColors = () => {
    if (isOwn) {
      return isEmployer
        ? "bg-blue-700/50 border-blue-300 text-blue-100"
        : "bg-primary/70 border-primary-foreground/50 text-primary-foreground/90";
    }
    return "bg-muted/80 border-muted-foreground/50 text-muted-foreground";
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    // Check if swipe exceeded threshold
    if (info.offset.x > SWIPE_THRESHOLD) {
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      onReply(message);
    }
    
    // ALWAYS spring back to origin - this is the key fix
    await controls.start({
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      }
    });
    
    setShowReplyIcon(false);
  };

  const handleDrag = (_: any, info: PanInfo) => {
    setShowReplyIcon(info.offset.x > 20);
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} group relative`}>
      {/* Reply icon that appears during swipe - only for received messages */}
      {!isOwn && (
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-muted"
          style={{ 
            opacity: replyIconOpacity, 
            scale: replyIconScale,
          }}
        >
          <Reply className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      )}

      <motion.div
        className="flex flex-col max-w-[75%]"
        drag={!isOwn ? "x" : false}
        // Key fix: constraints at 0 create elastic resistance
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
      >
        {/* Reply preview */}
        {message.reply_to && (
          <div 
            className={`text-xs px-3 py-1.5 rounded-t-xl mb-0.5 border-l-2 ${getReplyPreviewColors()}`}
          >
            <p className="font-medium truncate">
              {message.reply_to.content.substring(0, 50)}
              {message.reply_to.content.length > 50 ? "..." : ""}
            </p>
          </div>
        )}
        
        <div className={`px-4 py-2 rounded-2xl relative ${getBubbleColors()}`}>
          {/* Attachment image */}
          {message.attachment_url && (
            <div className="mb-2 -mx-2 -mt-1">
              <img 
                src={message.attachment_url} 
                alt="Allegato" 
                className="rounded-xl max-w-full h-auto object-cover max-h-64"
              />
            </div>
          )}
          
          {message.content && message.content !== "📷 Foto" && (
            <p className="text-sm message-content select-text">{message.content}</p>
          )}
          
          {/* Timestamp and read receipts */}
          <div className={`flex items-center justify-end gap-1 mt-1 ${getTimestampColors()}`}>
            <span className="text-xs">{formatTime(message.created_at)}</span>
            {isOwn && (
              <CheckCheck className={`w-4 h-4 ${getCheckColors()}`} />
            )}
          </div>

          {/* Reply button (visible on hover for desktop) */}
          {!isOwn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReply(message);
              }}
              className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 hidden md:block"
            >
              <Reply className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};