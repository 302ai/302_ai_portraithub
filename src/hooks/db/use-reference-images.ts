import { createScopedLogger } from "@/utils/logger";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { useCallback } from "react";

const logger = createScopedLogger("use-reference-images");
const PAGE_SIZE = 99999;

export const useReferenceImages = (page = 1) => {
  const offset = (page - 1) * PAGE_SIZE;

  const referenceImages = useLiveQuery(async () => {
    const [items, total] = await Promise.all([
      db.referenceImages
        .orderBy("id")
        .reverse()
        .offset(offset)
        .limit(PAGE_SIZE)
        .toArray(),
      db.referenceImages.count(),
    ]);

    return {
      items,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      currentPage: page,
    };
  }, [page]);

  const addReferenceImage = useCallback(
    async (imageUrl: string, imageId?: number) => {
      const id = imageId ? imageId : (await db.referenceImages.count()) + 1;
      await db.referenceImages.add({
        id,
        url: imageUrl,
        isUserUploaded: true,
      });
      return id;
    },
    []
  );

  const deleteReferenceImage = useCallback(async (id: number) => {
    await db.referenceImages.delete(id);
  }, []);

  return {
    referenceImages,
    addReferenceImage,
    deleteReferenceImage,
  };
};
