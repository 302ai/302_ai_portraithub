"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Trophy,
  Download,
  ImageOff,
  PlayIcon,
  Video,
} from "lucide-react";
import Image from "next/image";
import { GalleryModal } from "@/components/ui/gallery/gallery-modal";
import { VideoPlayerModal } from "@/components/ui/gallery/video-player-modal";
import { VideoModal } from "@/components/ui/gallery/video-modal";
import { useState, useMemo, useEffect } from "react";
import type { MediaItemType } from "@/components/ui/gallery/gallery";
import type { History as HistoryType } from "@/db/types";
import { useMonitorMessage } from "@/hooks/global/use-monitor-message";
import { pollVideoStatus } from "@/services/gen-image-to-video";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useHomeHistory } from "@/hooks/db/use-home-history";
import { useHistory } from "@/hooks/db/use-gen-history";
import { store } from "@/stores";
import { appConfigAtom } from "@/stores";

interface GalleryItem extends MediaItemType {
  id: string;
  url: string;
  base64: string;
  title: string;
  desc: string;
  tag?: string;
}

export default function History() {
  const t = useTranslations("history");
  const sidebarT = useTranslations("sidebar");
  const commonT = useTranslations("common");
  const globalT = useTranslations("global.error");
  const [page, setPage] = useState(1);
  const { history, deleteHistory } = useHomeHistory(page);
  const { addHistory, addVideoToHistory, updateVideoStatus, getPendingVideos } =
    useHistory();
  const [pollingTasks, setPollingTasks] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideoItem, setSelectedVideoItem] =
    useState<MediaItemType | null>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedItemForVideo, setSelectedItemForVideo] =
    useState<GalleryItem | null>(null);
  const { handleDownload } = useMonitorMessage();
  const { region, apiKey } = store.get(appConfigAtom);

  // URL replacement function
  const processUrl = (url: string): string => {
    if (
      typeof url === "string" &&
      url.includes("file.302.ai") &&
      region === 0
    ) {
      return url.replace("file.302.ai", "file.302ai.cn");
    }
    return url;
  };

  // 将当前记录的图片转换为GalleryModal需要的格式
  const currentGalleryItems = useMemo(() => {
    if (!selectedItem || !history) return [];

    const record = history.items.find(
      (h) => h.image.base64 === selectedItem.base64
    );

    if (!record) return [];

    const processedBase64 = processUrl(record.image.base64);

    return [
      {
        id: record.id,
        url: "",
        base64: processedBase64,
        desc: record.image.prompt,
        title: record.image.prompt,
        model: record.image.model,
      },
    ];
  }, [selectedItem, history, t, region]);

  const handleImageClick = (
    record: HistoryType,
    image: HistoryType["image"]
  ) => {
    // 如果是视频且成功生成了，打开视频播放器
    if (record.video?.status === "success" && record.video.url) {
      setSelectedVideoItem({
        id: record.id,
        url: image.base64, // 始终使用原图
        base64: image.base64, // 始终使用原图
        title: image.prompt,
        desc: image.prompt,
        type: "video",
        status: "success",
        videoUrl: record.video.url,
        coverUrl: record.video.coverUrl,
        model: image.model,
      });
      setIsVideoPlayerOpen(true);
    } else {
      // 否则打开图片预览（包括pending/failed状态的视频）
      const processedBase64 = processUrl(image.base64);
      setSelectedItem({
        id: `${record.id}`,
        url: "",
        base64: processedBase64,
        desc: image.prompt,
        title: image.prompt,
        model: image.model,
      });
      setIsModalOpen(true);
    }
  };

  // 轮询pending视频
  useEffect(() => {
    const pollPendingVideos = async () => {
      if (!apiKey) return;

      try {
        const pendingVideos = await getPendingVideos();

        for (const historyItem of pendingVideos) {
          if (historyItem.video?.taskId) {
            const taskId = historyItem.video.taskId;

            // 检查是否已在轮询中，避免重复轮询
            if (pollingTasks.has(taskId)) {
              continue;
            }

            // 标记该任务正在轮询
            setPollingTasks((prev) => new Set([...prev, taskId]));

            try {
              const result = await pollVideoStatus({
                apiKey,
                taskId,
              });

              // 根据结果更新状态
              if (result.status === "success" && result.url) {
                const videoUrl = result.url;
                // 使用原始传入的图片作为封面
                const coverUrl = historyItem.video.sourceImageBase64;

                await updateVideoStatus(
                  historyItem.id,
                  "success",
                  videoUrl,
                  coverUrl
                );

                // 轮询完成，从集合中移除
                setPollingTasks((prev) => {
                  const next = new Set(prev);
                  next.delete(taskId);
                  return next;
                });
              } else if (
                result.status === "fail" ||
                result.status === "error"
              ) {
                await updateVideoStatus(historyItem.id, "failed");

                // 轮询完成，从集合中移除
                setPollingTasks((prev) => {
                  const next = new Set(prev);
                  next.delete(taskId);
                  return next;
                });
              } else {
                // 如果还在处理中，从轮询集合中移除，允许下次继续轮询
                setPollingTasks((prev) => {
                  const next = new Set(prev);
                  next.delete(taskId);
                  return next;
                });
              }
            } catch (error) {
              console.error(`Failed to poll video ${taskId}:`, error);
              // 轮询出错时标记为失败，停止继续轮询这个任务
              await updateVideoStatus(historyItem.id, "failed");

              // 轮询完成，从集合中移除
              setPollingTasks((prev) => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to get pending videos:", error);
      }
    };

    // 立即执行一次
    pollPendingVideos();

    // 每30秒轮询一次
    const interval = setInterval(pollPendingVideos, 30000);

    return () => clearInterval(interval);
  }, [apiKey, getPendingVideos, updateVideoStatus, pollingTasks]);

  if (!history) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  if (history.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-muted p-3">
          <ImageOff className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-semibold">
          {t("noHistoryTitle") || "No history found"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("noHistoryMessage") || "Your generated images will appear here"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col gap-4">
      <div className="">
        <div className="rounded-lg bg-card text-card-foreground focus-within:border-transparent focus-within:ring-1 focus-within:ring-violet-500">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.items.map((record) => (
              <div
                key={record.id}
                className="group relative rounded-lg border bg-background p-4"
              >
                {/* 头部信息 */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(record.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* 图片转视频按钮 - 只在没有视频或视频生成失败时显示 */}
                    {(!record.video || record.video.status === "failed") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          const processedBase64 = processUrl(
                            record.image.base64
                          );
                          setSelectedItemForVideo({
                            id: record.id,
                            url: "",
                            base64: processedBase64,
                            title: record.image.prompt,
                            desc: record.image.prompt,
                            historyId: record.id,
                            status: "success",
                            type: record.image.type,
                            model: record.image.model,
                          });
                          setIsVideoModalOpen(true);
                        }}
                        title={t("generateVideo") || "Generate Video"}
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={async (e) => {
                        e.stopPropagation();
                        // 如果是视频且成功生成了，下载视频
                        if (
                          record.video?.status === "success" &&
                          record.video.url
                        ) {
                          try {
                            const response = await fetch(record.video.url);
                            const blob = await response.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = blobUrl;
                            link.download = `${record.image.prompt.slice(0, 10)}_video.mp4`;
                            link.style.display = "none";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(blobUrl);
                          } catch (error) {
                            console.error("Video download failed:", error);
                            // 如果下载失败，在新窗口打开视频
                            window.open(record.video.url, "_blank");
                          }
                        } else {
                          // 否则下载图片
                          handleDownload(
                            record.image.base64,
                            `${record.image.prompt.slice(0, 10)}.png`
                          );
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={() => deleteHistory(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 图片/视频展示 */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <div
                      className="group/image relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg border transition-all hover:scale-[1.02]"
                      onClick={() => handleImageClick(record, record.image)}
                    >
                      {/* Pending/Failed状态显示灰色背景 */}
                      {(record.video?.status === "pending" ||
                        record.video?.status === "failed") && (
                        <div
                          className="absolute inset-0 bg-gray-200 dark:bg-gray-800"
                          style={{ zIndex: 1 }}
                        ></div>
                      )}

                      {/* 显示原图，pending/failed状态不显示 */}
                      <Image
                        src={processUrl(record.image.base64)}
                        alt={record.image.prompt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        style={{
                          display:
                            record.video?.status === "pending" ||
                            record.video?.status === "failed"
                              ? "none"
                              : "block",
                        }}
                      />

                      {/* 视频播放图标 */}
                      {record.video?.status === "success" &&
                        record.video.url && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="rounded-full bg-black/50 p-3 backdrop-blur-sm transition-colors hover:bg-black/70">
                              <PlayIcon className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        )}

                      {/* 视频生成中状态 */}
                      {record.video?.status === "pending" && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
                          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-500"></div>
                          <span className="absolute font-medium text-white">
                            {globalT("generating")}
                          </span>
                        </div>
                      )}

                      {/* 视频生成失败状态 */}
                      {record.video?.status === "failed" && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
                          <div className="flex flex-col items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="32"
                              height="32"
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
                              {globalT("generate_failed")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-center text-sm">
                      <div className="font-medium">
                        {sidebarT(`${record.image.type?.replace("-", "_")}`)}
                      </div>
                      {record.image.model && (
                        <div className="mt-1 text-xs text-muted-foreground/80">
                          {record.image.model}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {history.totalPages > 1 && (
            <div className="@lg:pb-3 px-4 py-3">
              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={cn(
                        page === 1 && "pointer-events-none opacity-50"
                      )}
                      aria-label={commonT("pagination.previous")}
                    >
                      <span>{commonT("pagination.previous")}</span>
                    </PaginationPrevious>
                  </PaginationItem>
                  {Array.from(
                    { length: history.totalPages },
                    (_, i) => i + 1
                  ).map((pageNumber) => {
                    // Show first page, current page, last page, and pages around current page
                    if (
                      pageNumber === 1 ||
                      pageNumber === history.totalPages ||
                      (pageNumber >= page - 1 && pageNumber <= page + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => setPage(pageNumber)}
                            isActive={page === pageNumber}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    // Show ellipsis for gaps
                    if (
                      pageNumber === 2 ||
                      pageNumber === history.totalPages - 1
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationEllipsis>
                            <span className="sr-only">
                              {commonT("pagination.more_pages")}
                            </span>
                          </PaginationEllipsis>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(history.totalPages, p + 1))
                      }
                      className={cn(
                        page === history.totalPages &&
                          "pointer-events-none opacity-50"
                      )}
                      aria-label={commonT("pagination.next")}
                    >
                      <span>{commonT("pagination.next")}</span>
                    </PaginationNext>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      {/* 图片预览弹窗 */}
      {selectedItem && (
        <GalleryModal
          showContent={false}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedItem={selectedItem}
          setSelectedItem={(item) => setSelectedItem(item as GalleryItem)}
          mediaItems={currentGalleryItems}
          showDelete={false}
          onDownload={(item) => {
            if (item.base64) {
              const processedBase64 = processUrl(item.base64);
              handleDownload(processedBase64, `${item.desc.slice(0, 10)}.png`);
            }
          }}
        />
      )}

      {/* 视频播放弹窗 */}
      {selectedVideoItem && (
        <VideoPlayerModal
          item={selectedVideoItem}
          isOpen={isVideoPlayerOpen}
          onClose={() => setIsVideoPlayerOpen(false)}
        />
      )}

      {/* 图片转视频弹窗 */}
      {selectedItemForVideo && (
        <VideoModal
          item={selectedItemForVideo}
          isOpen={isVideoModalOpen}
          onClose={() => {
            setIsVideoModalOpen(false);
            setSelectedItemForVideo(null);
          }}
          onVideoGenerated={async (taskId, videoData) => {
            // 创建一个新的历史记录项用于视频
            const tempHistoryId = await addHistory({
              rawPrompt: videoData.prompt,
              shouldOptimize: false,
              image: {
                base64: videoData.sourceImageBase64,
                prompt: videoData.prompt,
                model: selectedItemForVideo?.type || "realistic_photo",
                status: "success",
                type: selectedItemForVideo?.type || "realistic_photo",
              },
            });

            // 然后添加视频信息到新创建的历史记录
            await addVideoToHistory(tempHistoryId, {
              taskId,
              prompt: videoData.prompt,
              model: videoData.model,
              duration: videoData.duration,
              sourceImageBase64: videoData.sourceImageBase64,
            });
          }}
        />
      )}
    </div>
  );
}
