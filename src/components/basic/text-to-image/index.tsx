import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import React, { useEffect, useState } from "react";
import { Card } from "../../ui/card";
import { generateImage } from "@/services/gen-image";
import { useHistory } from "@/hooks/db/use-gen-history";
import { createScopedLogger } from "@/utils/logger";
import { Button } from "../../ui/button";
import { appConfigAtom } from "@/stores/slices/config_store";
import { store } from "@/stores";
import { Label } from "../../ui/label";
import { useSearchParams } from "next/navigation";
import { translatePrompt } from "@/services/translate-prompt";
import { generationStoreAtom } from "@/stores/slices/generation_store";
import { useAtom } from "jotai";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { models } from "@/constants/models";
import { useFromMulerun } from "@/hooks/useMulerun";

const logger = createScopedLogger("Home");
let firstTime = true;

const TextToImage = () => {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const { history, updateHistory, addHistory } = useHistory();
  const [prompt, setPrompt] = useState<string | null>(null);
  const locale = useLocale();
  const [language, setLanguage] = useState<"ZH" | "EN" | "JA" | "">(
    locale.toUpperCase() as "ZH" | "EN" | "JA" | ""
  );
  const { apiKey } = store.get(appConfigAtom);
  const [isOptimize, setIsOptimize] = useState(true);
  const [generationCount, setGenerationCount] = useAtom(generationStoreAtom);
  const [isTranslate, setIsTranslate] = useState(false);
  const [model, setModel] = useState("gemini-2.5-flash-image-preview");
  const { isMulerun, sessionId, agentId } = useFromMulerun();
  useEffect(() => {
    const promptParam = searchParams.get("prompt");
    const modelParam = searchParams.get("model");
    const imageParam = searchParams.get("image");

    if (promptParam && firstTime && !imageParam) {
      setPrompt(promptParam);
      setModel(modelParam || "gpt-image-1");
      logger.debug("Received prompt:", promptParam);
      const autoGenerateImage = async () => {
        let historyId = "";
        if (generationCount.generationCount >= 4) {
          toast.warning(t("global.error.max_generation"));
          return;
        }
        // if (prompt.trim() === "") {
        //   toast.error(t("basic.input.placeholder"));
        //   return;
        // }
        setGenerationCount((prev) => ({
          ...prev,
          loading: true,
          generationCount: prev.generationCount + 1,
        }));

        historyId = await addHistory({
          rawPrompt: promptParam || t("basic.default_prompt"),
          shouldOptimize: isOptimize,
          image: {
            base64: "",
            prompt: "",
            model: "",
            status: "pending",
            type: "realistic_photo",
          },
        });

        try {
          const result = await generateImage({
            prompt: promptParam || t("basic.default_prompt"),
            isOptimize,
            apiKey: apiKey || "",
            model: model,
            mulerunSessionId: isMulerun ? sessionId : undefined,
            isMulerun: isMulerun,
            agentId: isMulerun ? agentId : undefined,
          });

          updateHistory(historyId, {
            rawPrompt: prompt || "",
            shouldOptimize: isOptimize,
            image: {
              base64: "data:image/png;base64," + result.image.image,
              prompt: result.image.prompt,
              model: result.image.model || model,
              status: "success",
              type: "realistic_photo",
            },
          });
        } catch (error) {
          updateHistory(historyId, {
            rawPrompt: prompt || "",
            shouldOptimize: isOptimize,
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

        // 图片生成逻辑
        logger.debug("Generating image with prompt:", prompt);
      };
      autoGenerateImage();
      firstTime = false;
    }
  }, [searchParams]);

  const handleGenerateImage = async (paramsPrompt: string | null = null) => {
    let historyId = "";
    if (generationCount.generationCount >= 4) {
      toast.warning(t("global.error.max_generation"));
      return;
    }
    // if (prompt.trim() === "") {
    //   toast.error(t("basic.input.placeholder"));
    //   return;
    // }
    setGenerationCount((prev) => ({
      ...prev,
      loading: true,
      generationCount: prev.generationCount + 1,
    }));

    historyId = await addHistory({
      rawPrompt: prompt || paramsPrompt || t("basic.default_prompt"),
      shouldOptimize: isOptimize,
      image: {
        base64: "",
        prompt: "",
        model: "",
        status: "pending",
        type: "realistic_photo",
      },
    });

    try {
      const result = await generateImage({
        prompt: prompt || paramsPrompt || t("basic.default_prompt"),
        isOptimize,
        apiKey: apiKey || "",
        model,
        mulerunSessionId: isMulerun ? sessionId : undefined,
        isMulerun: isMulerun,
        agentId: isMulerun ? agentId : undefined,
      });

      updateHistory(historyId, {
        rawPrompt: prompt || "",
        shouldOptimize: isOptimize,
        image: {
          base64: "data:image/png;base64," + result.image.image,
          prompt: result.image.prompt,
          model: result.image.model || model,
          status: "success",
          type: "realistic_photo",
        },
      });
    } catch (error) {
      updateHistory(historyId, {
        rawPrompt: prompt || "",
        shouldOptimize: isOptimize,
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

    // 图片生成逻辑
    logger.debug("Generating image with prompt:", prompt);
  };

  const handleTranslate = async (language: "ZH" | "EN" | "JA") => {
    if (!language) return;
    try {
      setIsTranslate(true);
      const result = await translatePrompt({
        message: prompt || "",
        language: language,
        apiKey: apiKey || "",
      });
      setPrompt(result.translatedText);
    } catch (error) {
      toast.error(t("global.error.translate_failed"));
    } finally {
      setIsTranslate(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* 左侧输入框 */}
      <Card className="flex-1">
        <Textarea
          placeholder={t("basic.input.placeholder")}
          value={prompt || ""}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-full resize-none border-none focus-visible:ring-0"
        />
      </Card>

      {/* 右侧控制区域 */}
      <div className="flex w-full flex-col gap-4 md:w-40">
        {/* 翻译下拉框 */}
        <div className="space-y-2">
          <Select
            value={language}
            onValueChange={(value) => {
              setLanguage(value as "ZH" | "EN" | "JA");
              handleTranslate(value as "ZH" | "EN" | "JA");
            }}
            disabled={isTranslate}
          >
            <SelectTrigger id="language">
              <SelectValue placeholder={t("basic.input.select")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EN">{t("basic.language.en")}</SelectItem>
              <SelectItem value="ZH">{t("basic.language.zh")}</SelectItem>
              <SelectItem value="JA">{t("basic.language.ja")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 模型选择下拉框 */}
        <div className="space-y-2">
          <Label htmlFor="model-select" className="text-sm">
            {t("common.model")}
          </Label>
          <Select value={model} onValueChange={(value) => setModel(value)}>
            <SelectTrigger id="model-select">
              <SelectValue placeholder={t("common.model")} />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 优化提示词开关 */}
        <div className="flex items-center justify-between">
          <Label htmlFor="optimize-prompt" className="text-sm">
            {t("basic.optimize")}
          </Label>
          <Switch
            id="optimize-prompt"
            checked={isOptimize}
            onCheckedChange={() => setIsOptimize(!isOptimize)}
          />
        </div>

        {/* 生成图片按钮 */}
        <Button
          className="w-full bg-purple-500 text-white hover:bg-purple-600"
          onClick={() => handleGenerateImage()}
        >
          {t("global.generate_image")}
        </Button>
      </div>
    </div>
  );
};

export default TextToImage;
