import { useState } from "react";
import { useAtom } from "jotai";
import { generationStoreAtom } from "@/stores/slices/generation_store";
import { appConfigAtom, store } from "@/stores";
import { toast } from "sonner";
import { useHistory } from "@/hooks/db/use-gen-history";
import { generateImage } from "@/services/gen-img";
import { useTranslations } from "next-intl";
import { useFromMulerun } from "./useMulerun";
type GenerateImageOptions = {
  rawPrompt: string;
  prompt: string;
  isOptimize?: boolean;
  customOptimizePrompt?: string;
  size?: "1536x1024" | "1024x1024" | "1024x1536";
  type?: string;
  model?: string;
  sourceLang?: "ZH" | "EN";
};

export function useGenerateImage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationCount, setGenerationCount] = useAtom(generationStoreAtom);
  const { apiKey } = store.get(appConfigAtom);
  const { addHistory, updateHistory } = useHistory();
  const { isMulerun, sessionId, agentId } = useFromMulerun();
  const t = useTranslations();
  const generateImg = async (options: GenerateImageOptions) => {
    if (generationCount.generationCount >= 4) {
      toast.warning(t("global.error.max_generation"));
      return null;
    }

    setIsGenerating(true);
    setGenerationCount((prev) => ({
      ...prev,
      loading: true,
      generationCount: prev.generationCount + 1,
    }));

    let historyId = "";
    try {
      historyId = await addHistory({
        rawPrompt: options.rawPrompt,
        shouldOptimize: Boolean(options.isOptimize),
        image: {
          base64: "",
          prompt: options.prompt,
          model: options.model || "",
          status: "pending",
          size: options.size,
          type: options.type || "",
        },
      });

      const { image }: any = await generateImage({
        prompt: options.prompt,
        apiKey: apiKey || "",
        isOptimize: options.isOptimize,
        customOptimizePrompt: options.customOptimizePrompt,
        size: options.size,
        model: options.model,
        sourceLang: options.sourceLang,
        mulerunSessionId: isMulerun ? sessionId : undefined,
        isMulerun: isMulerun,
        agentId: isMulerun ? agentId : undefined,
      });

      updateHistory(historyId, {
        rawPrompt: options.rawPrompt,
        shouldOptimize: Boolean(options.isOptimize),
        image: {
          base64: "data:image/png;base64," + image.images[0].base64Data,
          prompt: options.prompt,
          model: options.model || "",
          status: "success",
          type: options.type,
        },
      });

      return image;
    } catch (error) {
      console.error(error);
      toast.error(t("global.error.generate_failed"));
      updateHistory(historyId, {
        rawPrompt: options.rawPrompt,
        shouldOptimize: Boolean(options.isOptimize),
        image: {
          base64: "",
          prompt: "",
          model: "",
          status: "failed",
          type: options.type,
        },
      });
    } finally {
      setIsGenerating(false);
      setGenerationCount((prev) => ({
        ...prev,
        generationCount: Math.max(prev.generationCount - 1, 0),
        loading: false,
      }));
    }
  };

  return {
    isGenerating,
    generateImg,
  };
}
