import { createScopedLogger } from "@/utils/logger";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/db";
import { History } from "@/db/types";
import { useCallback } from "react";
import { AddHistory } from "@/db/types";
import { useFromMulerun } from "../useMulerun";

const logger = createScopedLogger("use-gen-history");
const PAGE_SIZE = 16;

export const useHistory = (page = 1) => {
  const offset = (page - 1) * PAGE_SIZE;
  const { isMulerun, sessionId } = useFromMulerun();

  const history = useLiveQuery(async () => {
    let items: History[];
    let total: number;

    if (isMulerun && sessionId) {
      // MuleRun模式：只显示当前会话的历史记录
      const allItems = await db.history
        .orderBy("createdAt")
        .reverse()
        .toArray();

      // 过滤出属于当前MuleRun会话的记录
      const filteredItems = allItems.filter(
        (item) => item.mulerunSessionId === sessionId
      );

      items = filteredItems.slice(offset, offset + PAGE_SIZE);
      total = filteredItems.length;
    } else {
      // 普通模式：显示所有历史记录（但排除MuleRun会话的记录）
      const allItems = await db.history
        .orderBy("createdAt")
        .reverse()
        .toArray();

      // 过滤出不属于任何MuleRun会话的记录
      const filteredItems = allItems.filter((item) => !item.mulerunSessionId);

      items = filteredItems.slice(offset, offset + PAGE_SIZE);
      total = filteredItems.length;
    }

    return {
      items,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      currentPage: page,
    };
  }, [page, isMulerun, sessionId]);

  const addHistory = useCallback(
    async (history: AddHistory) => {
      const id = crypto.randomUUID();
      await db.history.add({
        ...history,
        id,
        createdAt: Date.now(),
        // 如果是MuleRun模式，添加会话ID
        mulerunSessionId: isMulerun ? sessionId : undefined,
      });
      return id;
    },
    [isMulerun, sessionId]
  );

  const updateHistory = useCallback((id: string, history: Partial<History>) => {
    db.history.update(id, history);
  }, []);

  const deleteHistory = useCallback((id: string) => {
    db.history.delete(id);
  }, []);

  const updateHistoryImage = useCallback(
    async (
      historyId: string,
      index: number,
      image: {
        base64: string;
        prompt: string;
        model: string;
        status: "success" | "failed";
      }
    ) => {
      await db.history
        .where("id")
        .equals(historyId)
        .modify((history: History) => {
          history.image = image;
        });
    },
    []
  );

  const updateHistoryImageStatus = useCallback(
    async (
      historyId: string,
      index: number,
      status: "pending" | "success" | "failed"
    ) => {
      await db.history
        .where("id")
        .equals(historyId)
        .modify((history: History) => {
          history.image.status = status;
        });
    },
    []
  );

  // 视频相关的操作函数
  const addVideoToHistory = useCallback(
    async (
      historyId: string,
      videoData: {
        taskId: string;
        prompt: string;
        model: string;
        duration: string;
        sourceImageBase64: string;
      }
    ) => {
      await db.history
        .where("id")
        .equals(historyId)
        .modify((history: History) => {
          history.video = {
            ...videoData,
            status: "pending" as const,
          };
        });
    },
    []
  );

  const updateVideoStatus = useCallback(
    async (
      historyId: string,
      status: "pending" | "success" | "failed",
      url?: string,
      coverUrl?: string
    ) => {
      await db.history
        .where("id")
        .equals(historyId)
        .modify((history: History) => {
          if (history.video) {
            history.video.status = status;
            if (url) {
              history.video.url = url;
            }
            if (coverUrl) {
              history.video.coverUrl = coverUrl;
            }
          }
        });
    },
    []
  );

  const getPendingVideos = useCallback(async () => {
    const pendingVideos = await db.history
      .filter(
        (history: any) => history.video && history.video.status === "pending"
      )
      .toArray();
    return pendingVideos;
  }, []);

  return {
    history,
    addHistory,
    updateHistory,
    deleteHistory,
    updateHistoryImage,
    updateHistoryImageStatus,
    // 新增的视频相关函数
    addVideoToHistory,
    updateVideoStatus,
    getPendingVideos,
  };
};
