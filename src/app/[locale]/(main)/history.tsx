import WaterfallGallery from "@/components/ui/gallery/waterfall-gallery";
import { useHistory } from "@/hooks/db/use-gen-history";
import { useMonitorMessage } from "@/hooks/global/use-monitor-message";
import { useFromMulerun } from "@/hooks/useMulerun";
import { store } from "@/stores";
import { appConfigAtom } from "@/stores";
import { generationStoreAtom } from "@/stores/slices/generation_store";
import { pollVideoStatus } from "@/services/gen-image-to-video";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import React, { useEffect, useCallback, useState } from "react";

interface HistoryProps {
  pageSize?: number;
}
const processExamples = (exampleList: any, region?: number) => {
  return exampleList.map((example: any) => {
    if (region === 0) {
      return {
        ...example,
        img: example.img.replace("file.302.ai", "file.302ai.cn"),
      };
    }
    return example;
  });
};
const History = ({ pageSize }: HistoryProps) => {
  const {
    history,
    deleteHistory,
    addHistory,
    addVideoToHistory,
    updateVideoStatus,
    getPendingVideos,
  } = useHistory(1);
  const { isMulerun, sessionId } = useFromMulerun();
  const t = useTranslations();
  const { handleDownload } = useMonitorMessage();
  const [generationCount, setGenerationCount] = useAtom(generationStoreAtom);
  const { region, apiKey } = store.get(appConfigAtom);

  // 调试信息

  // 正在轮询的任务集合
  const [pollingTasks, setPollingTasks] = useState<Set<string>>(new Set());

  // 视频生成处理函数
  const handleVideoGenerated = useCallback(
    async (
      taskId: string,
      videoData: {
        prompt: string;
        model: string;
        duration: string;
        sourceImageBase64: string;
        originalImageType: string;
        originalImageModel: string;
      }
    ) => {
      // 创建一个新的历史记录项用于视频
      const tempHistoryId = await addHistory({
        rawPrompt: videoData.prompt,
        shouldOptimize: false,
        image: {
          base64: videoData.sourceImageBase64,
          prompt: videoData.prompt,
          model: videoData.originalImageModel, // 使用原图片的模型
          status: "success",
          type: videoData.originalImageType, // 使用原图片的类型
        },
      });

      // 添加视频信息到历史记录
      await addVideoToHistory(tempHistoryId, {
        taskId,
        prompt: videoData.prompt,
        model: videoData.model,
        duration: videoData.duration,
        sourceImageBase64: videoData.sourceImageBase64,
      });
    },
    [addHistory, addVideoToHistory]
  );

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

  const mediaItems =
    history?.items?.map((history) => {
      let base64Value = history.image.base64 || "";
      // If base64 is a URL and region is 0, replace domain
      if (
        typeof base64Value === "string" &&
        base64Value.includes("file.302.ai") &&
        region === 0
      ) {
        base64Value = base64Value.replace("file.302.ai", "file.302ai.cn");
      }

      // 如果有视频且成功生成了，优先显示视频封面
      let displayImage = base64Value;
      let itemType = history.image.type;
      let displayTitle = history.rawPrompt;

      if (
        history.video &&
        history.video.status === "success" &&
        history.video.coverUrl
      ) {
        displayImage = history.video.coverUrl;
        itemType = "video";
        // 对于视频，title显示原图片类型而不是提示词
        displayTitle = history.image.type || history.rawPrompt;
      } else if (history.video && history.video.status === "pending") {
        itemType = "video-pending";
        displayTitle = history.image.type || history.rawPrompt;
      }

      return {
        id: history.id,
        desc: history.rawPrompt,
        base64: displayImage,
        url: displayImage,
        historyId: history.id,
        title: displayTitle,
        status: history.video?.status || history.image.status,
        type: itemType,
        model:
          itemType === "video" || itemType === "video-pending"
            ? history.video?.model
            : history.image.model,
        // 附加视频信息
        videoUrl: history.video?.url,
        coverUrl: history.video?.coverUrl,
      };
    }) || [];

  return (
    <div>
      <WaterfallGallery
        pageSize={pageSize}
        mediaItems={mediaItems}
        title={t("gallery.title")}
        description={t("gallery.description")}
        emptyStateMessage={t("gallery.emptyMessage")}
        insertAtStart
        onVideoGenerated={handleVideoGenerated}
        onDelete={(item) => {
          setGenerationCount((prev) => ({
            ...prev,
            generationCount: Math.max(prev.generationCount - 1, 0),
          }));
          if (item.historyId) {
            deleteHistory(item.historyId);
          }
        }}
        onDownload={async (item) => {
          // 如果是视频类型，下载视频文件
          if (item.type === "video" && item.videoUrl) {
            try {
              // 使用 fetch 获取视频文件
              const response = await fetch(item.videoUrl);
              const blob = await response.blob();

              // 创建 blob URL 并下载
              const blobUrl = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = blobUrl;
              link.download = `video.mp4`;
              link.style.display = "none";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              // 清理 blob URL
              URL.revokeObjectURL(blobUrl);
            } catch (error) {
              console.error("Video download failed:", error);
              // 如果下载失败，在新窗口打开视频（作为备选方案）
              window.open(item.videoUrl, "_blank");
            }
          } else if (item.base64) {
            // 否则下载图片
            handleDownload(item.base64, `${item.desc.slice(0, 30)}_image.png`);
          }
        }}
      />
    </div>
  );
};

export default History;
