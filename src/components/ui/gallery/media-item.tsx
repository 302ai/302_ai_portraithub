import { useState } from "react";
import { MediaItemProps } from "./gallery";
import { Image } from "@/components/ui/image";
import { IconButton } from "@/components/ui/icon-button";
import { Tag } from "@/components/ui/tag";
import { useTranslations } from "next-intl";
import { VideoIcon, PlayIcon } from "lucide-react";
import { VideoModal } from "./video-modal";
import { VideoPlayerModal } from "./video-player-modal";

export const MediaItem = ({
  item,
  className = "",
  onClick,
  onDelete,
  onDownload,
  showActions = true,
  showTag = true,
  onVideoGenerated,
}: MediaItemProps) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const t = useTranslations();
  const tSidebar = useTranslations("sidebar");

  const handleVideoModalClose = (isOutsideClick?: boolean) => {
    setIsVideoModalOpen(false);

    // 只有在外部点击关闭时才阻止事件传播
    if (isOutsideClick) {
      // 临时阻止点击事件传播
      const preventNextClick = (e: Event) => {
        e.stopImmediatePropagation();
        e.preventDefault();
        document.removeEventListener("click", preventNextClick, {
          capture: true,
        });
      };

      // 在捕获阶段添加一次性监听器
      setTimeout(() => {
        document.addEventListener("click", preventNextClick, {
          capture: true,
          once: true,
        });
      }, 0);
    }
  };

  const handleVideoPlayerClose = (isOutsideClick?: boolean) => {
    setIsVideoPlayerOpen(false);

    // 只有在外部点击关闭时才阻止事件传播
    if (isOutsideClick) {
      // 临时阻止点击事件传播
      const preventNextClick = (e: Event) => {
        e.stopImmediatePropagation();
        e.preventDefault();
        document.removeEventListener("click", preventNextClick, {
          capture: true,
        });
      };

      // 在捕获阶段添加一次性监听器
      setTimeout(() => {
        document.addEventListener("click", preventNextClick, {
          capture: true,
          once: true,
        });
      }, 0);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    // 如果模态框正在开启状态，不触发图片点击
    if (isVideoModalOpen || isVideoPlayerOpen) {
      e.stopPropagation();
      return;
    }

    // 视频类型不应该触发图片放大，播放图标会处理点击
    if (item.type === "video") {
      e.stopPropagation();
      return;
    }

    onClick?.(e);
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(item);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.(item);
  };

  const getImagePlaceholder = () => {
    return "";
  };

  return (
    <div className={`group relative ${className}`}>
      <div className="relative" style={{ aspectRatio: "1 / 1" }}>
        {showTag && item.tag && (
          <div className="absolute left-3 top-3 z-10">
            <Tag>{item.tag}</Tag>
          </div>
        )}

        {/* 视频播放图标 - 如果是视频类型显示播放图标 */}
        {item.type === "video" && item.videoUrl && (
          <div
            className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setIsVideoPlayerOpen(true);
            }}
          >
            <div className="rounded-full bg-black/50 p-4 backdrop-blur-sm transition-colors hover:bg-black/70">
              <PlayIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        )}

        {/* Video generation icon in top right corner - only show for images when status is success or undefined */}
        {item.type !== "video" &&
          item.type !== "video-pending" &&
          (!item.status || item.status === "success") && (
            <div
              className="absolute right-3 top-3 z-10 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setIsVideoModalOpen(true);
              }}
            >
              <div className="rounded-full bg-black/50 p-2 backdrop-blur-sm transition-colors hover:bg-black/70">
                <VideoIcon className="h-4 w-4 text-white" />
              </div>
            </div>
          )}

        {item.status === "pending" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-500"></div>
            <span className="absolute font-medium text-white">
              {t("global.error.generating")}
            </span>
          </div>
        )}

        {item.status === "failed" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
            <div className="flex flex-col items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="red"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <span className="mt-2 font-medium text-white">
                {t("global.error.generate_failed")}
              </span>
            </div>
          </div>
        )}

        {/* 悬浮信息显示 - 只在视频类型显示 */}
        {item.type === "video" && (
          <div className="absolute bottom-0 left-0 right-0 z-[50] flex flex-col bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="pr-20 text-white">
              {item.title && (
                <h3 className="text-lg font-semibold text-white">
                  {tSidebar(item.title.replace("-", "_"))}
                </h3>
              )}
              {item.model && (
                <div className="line-clamp-2 text-sm text-white/80">
                  {item.model}
                </div>
              )}
            </div>
          </div>
        )}

        {showActions && (
          <div className="absolute bottom-3 right-1 z-[60] flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <IconButton onClick={handleDownload} title="Download">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </IconButton>
            <IconButton onClick={handleDelete} title="Delete">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </IconButton>
          </div>
        )}

        {(item.status === "pending" || item.status === "failed") && (
          <div
            className="absolute inset-0 bg-gray-200 dark:bg-gray-800"
            style={{ zIndex: 1 }}
          ></div>
        )}

        <Image
          src={item.url}
          base64={
            item.status === "pending" || item.status === "failed"
              ? ""
              : item.base64
          }
          alt={item.title}
          className="h-full w-full cursor-pointer object-cover"
          onClick={handleImageClick}
        />
      </div>

      {/* Video Generation Modal */}
      <VideoModal
        item={item}
        isOpen={isVideoModalOpen}
        onClose={handleVideoModalClose}
        onVideoGenerated={onVideoGenerated}
      />

      {/* Video Player Modal */}
      <VideoPlayerModal
        item={item}
        isOpen={isVideoPlayerOpen}
        onClose={handleVideoPlayerClose}
      />
    </div>
  );
};
