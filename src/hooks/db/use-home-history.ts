import { createScopedLogger } from "@/utils/logger";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/db";
import { History } from "@/db/types";
import { useCallback } from "react";
import { AddHistory } from "@/db/types";
import { useFromMulerun } from "../useMulerun";

const logger = createScopedLogger("use-gen-history");
const PAGE_SIZE = 18;

export const useHomeHistory = (page = 1, pageSize = PAGE_SIZE) => {
  const offset = (page - 1) * pageSize;
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

      items = filteredItems.slice(offset, offset + pageSize);
      total = filteredItems.length;
    } else {
      // 普通模式：显示所有历史记录（但排除MuleRun会话的记录）
      const allItems = await db.history
        .orderBy("createdAt")
        .reverse()
        .toArray();

      // 过滤出不属于任何MuleRun会话的记录
      const filteredItems = allItems.filter((item) => !item.mulerunSessionId);

      items = filteredItems.slice(offset, offset + pageSize);
      total = filteredItems.length;
    }

    return {
      items,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
    };
  }, [page, pageSize, offset, isMulerun, sessionId]);

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

  return {
    history,
    addHistory,
    updateHistory,
    deleteHistory,
    updateHistoryImage,
    updateHistoryImageStatus,
  };
};
