"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MediaItemType } from "./gallery";
import { X } from "lucide-react";

interface VideoPlayerModalProps {
  item: MediaItemType;
  isOpen: boolean;
  onClose: (isOutsideClick?: boolean) => void;
}

export const VideoPlayerModal = ({
  item,
  isOpen,
  onClose,
}: VideoPlayerModalProps) => {
  const handleClose = (open: boolean) => {
    if (!open) {
      // 这是通过按钮关闭，不需要阻止事件
      onClose(false);
    }
  };

  const handlePointerDownOutside = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    // 使用 requestAnimationFrame 延迟执行，确保当前事件处理完成
    requestAnimationFrame(() => {
      // 这是通过外部点击关闭，需要阻止事件
      onClose(true);
    });
  };

  const handleInteractOutside = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Dialog modal open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="mx-4 max-w-3xl border-none p-0 [&>button]:hidden"
        onClick={(e) => e.stopPropagation()}
        onPointerDownOutside={handlePointerDownOutside}
        onInteractOutside={handleInteractOutside}
      >
        <div className="relative aspect-video w-full bg-black">
          {/* 明显的关闭按钮 */}
          <button
            className="absolute right-4 top-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/30"
            onClick={() => onClose(false)}
            aria-label="Close video"
          >
            <X className="h-4 w-4" />
          </button>

          {item.videoUrl && (
            <video
              className="h-full w-full"
              controls
              autoPlay
              src={item.videoUrl}
            >
              <source src={item.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
