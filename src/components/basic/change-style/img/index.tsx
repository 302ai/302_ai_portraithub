import React from "react";
import ImageDesc from "./image-desc";
import { Button } from "@/components/ui/button";
import { useHistory } from "@/hooks/db/use-gen-history";
import { useAtom } from "jotai";
import { actionReferenceImagesStoreAtom } from "@/stores/slices/action_reference_images_store";
import { logger } from "@/utils";
import { generateStyleImage } from "@/services/gen-style";
import { appConfigAtom } from "@/stores/slices/config_store";
import { store } from "@/stores";
import { createScopedLogger } from "@/utils";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { generationStoreAtom } from "@/stores/slices/generation_store";
import { env } from "@/env";
import ky from "ky";

const ChangeImage = () => {
  const { addHistory, updateHistory } = useHistory();
  const [actionReferenceImage, setActionReferenceImage] = useAtom(
    actionReferenceImagesStoreAtom
  );
  const { apiKey } = store.get(appConfigAtom);
  const t = useTranslations();
  const [generationCount, setGenerationCount] = useAtom(generationStoreAtom);

  const handleGenerateImage = async () => {
    if (generationCount.generationCount >= 4) {
      toast.warning(t("global.error.max_generation"));
      return;
    }

    if (!actionReferenceImage.actionImage) {
      toast.error(t("basic.warning.actionImage"));
      return;
    }
    if (!actionReferenceImage.referenceImage) {
      toast.error(t("basic.warning.referenceImage"));
      return;
    }
    let historyId = "";
    setGenerationCount((prev) => ({
      ...prev,
      loading: true,
      generationCount: prev.generationCount + 1,
    }));

    try {
      historyId = await addHistory({
        rawPrompt: "",
        shouldOptimize: false,
        image: {
          base64: "",
          prompt: "",
          model: "",
          status: "pending",
          type: "realistic_photo",
        },
      });

      let imageUrl = "";
      const { image } = await generateStyleImage({
        apiKey: apiKey || "",
        originImage: actionReferenceImage.actionImage,
        referenceImage: actionReferenceImage.referenceImage,
        model: "gpt-image-1",
      });

      imageUrl = image.url;

      // 更新历史记录
      updateHistory(historyId, {
        rawPrompt: "",
        shouldOptimize: false,
        image: {
          base64: imageUrl,
          prompt: "",
          model: "gpt-image-1",
          status: "success",
          type: "realistic_photo",
        },
      });
    } catch (error) {
      logger.error(`generateImage error: `, error);

      updateHistory(historyId, {
        rawPrompt: "",
        shouldOptimize: false,
        image: {
          base64: "",
          prompt: "",
          model: "",
          status: "failed",
          type: "realistic_photo",
        },
      });
    } finally {
      setGenerationCount((prev) => ({
        ...prev,
        loading: false,
        generationCount: Math.max(prev.generationCount - 1, 0),
      }));
    }
  };

  return (
    <div className="space-y-4">
      <ImageDesc />
      <div className="flex justify-end">
        <Button onClick={handleGenerateImage}>
          {t("global.generate_image")}
        </Button>
      </div>
    </div>
  );
};

export default ChangeImage;
