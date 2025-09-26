import { useState } from "react";
import { useAtom } from "jotai";
import { generationStoreAtom } from "@/stores/slices/generation_store";
import { appConfigAtom, store } from "@/stores";
import { toast } from "sonner";
import { useHistory } from "@/hooks/db/use-gen-history";
import { generateImage } from "@/services/gen-img";
import { genImgWithImg } from "@/services/gen-img-with-img";
import { useTranslations } from "next-intl";
import { useFromMulerun } from "./useMulerun";
import { isSessionRunning } from "../../mulerun-session-detector";
type ImageGenerationOptions = {
  rawPrompt?: string;
  prompt: string;
  imageData?: string;
  shouldUseImageInput?: boolean;
  type?: string;
  size?: "1024x1024" | "1536x1024" | "1024x1536";
  model?: string;
  sourceLang?: "ZH" | "EN";
  isOptimize?: boolean;
  customOptimizePrompt?: string;
};

export function useImageGeneration() {
  const [generationStore, setGenerationStore] = useAtom(generationStoreAtom);
  const { apiKey } = store.get(appConfigAtom);
  const { addHistory, updateHistory } = useHistory();
  const t = useTranslations();
  const { isMulerun, sessionId, agentId } = useFromMulerun();

  const generateWithImage = async (options: ImageGenerationOptions) => {
    if (generationStore.generationCount >= 4) {
      toast.warning(t("global.error.max_generation"));
      return null;
    }

    // 如果是MuleRun模式，检测会话是否还在运行
    if (isMulerun && sessionId) {
      try {
        const sessionRunning = await isSessionRunning(sessionId);
        if (!sessionRunning) {
          toast.error(t("global.error.session_ended"));
          return null;
        }
      } catch (error) {
        console.error("MuleRun session check failed:", error);
        toast.error(t("global.error.session_check_failed"));
        return null;
      }
    }

    setGenerationStore((prev) => ({
      ...prev,
      generationCount: prev.generationCount + 1,
    }));

    let historyId = "";
    try {
      historyId = await addHistory({
        rawPrompt: options.rawPrompt || "",
        shouldOptimize: false,
        image: {
          base64: "",
          prompt: options.prompt,
          model: options.model || "",
          status: "pending",
          type: options.type,
        },
      });

      if (options.shouldUseImageInput && options.imageData) {
        const { image }: any = await genImgWithImg({
          img: options.imageData,
          prompt: options.prompt,
          apiKey: apiKey || "",
          size: options.size,
          model: options.model,
          sourceLang: options.sourceLang,
          mulerunSessionId: isMulerun ? sessionId : undefined,
          isMulerun: isMulerun,
          agentId: isMulerun ? agentId : undefined,
          isOptimize: options.isOptimize,
          customOptimizePrompt: options.customOptimizePrompt,
        });

        updateHistory(historyId, {
          rawPrompt: options.rawPrompt || "",
          shouldOptimize: false,
          image: {
            base64:
              `data:image/png;base64,${image.b64_json}` || image.url || "",
            prompt: options.prompt,
            model: options.model || "",
            status: "success",
            type: options.type,
          },
        });

        return image;
      } else {
        const { image }: any = await generateImage({
          prompt: options.prompt,
          apiKey: apiKey || "",
          model: options.model,
          sourceLang: options.sourceLang,
          mulerunSessionId: isMulerun ? sessionId : undefined,
          isMulerun: isMulerun,
          agentId: isMulerun ? agentId : undefined,
        });

        updateHistory(historyId, {
          rawPrompt: options.rawPrompt || "",
          shouldOptimize: false,
          image: {
            base64: "data:image/png;base64," + image.images[0].base64Data,
            prompt: options.prompt,
            model: options.model || "",
            status: "success",
            type: options.type,
          },
        });

        return image;
      }
    } catch (error) {
      console.error(error);
      toast.error(t("global.error.generate_failed"));
      updateHistory(historyId, {
        rawPrompt: options.rawPrompt || "",
        shouldOptimize: false,
        image: {
          base64: "",
          prompt: "",
          model: "",
          status: "failed",
          type: options.type,
        },
      });
      return null;
    } finally {
      setGenerationStore((prev) => ({
        ...prev,
        generationCount: Math.max(prev.generationCount - 1, 0),
      }));
    }
  };

  return {
    isGenerating: generationStore.generationCount >= 4,
    generateWithImage,
    canGenerate: generationStore.generationCount < 4,
    currentGenerationCount: generationStore.generationCount,
  };
}
