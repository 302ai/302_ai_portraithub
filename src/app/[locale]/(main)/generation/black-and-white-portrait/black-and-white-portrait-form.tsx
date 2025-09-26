"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import { ExampleStore, exampleStoreAtom } from "@/stores/slices/example_store";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { toast } from "sonner";
import ImageDrop from "@/components/basic/change-style/text/image-drop";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { models } from "@/constants/models";
import { pageExamples } from "@/constants/page-examples";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ModelExampleImage from "./model-example-image";

export default function BlackAndWhitePortraitForm() {
  const t = useTranslations();
  const [exampleStore, setExampleStore] = useAtom(exampleStoreAtom);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageForm, setImageForm] = useState("");
  const { canGenerate, generateWithImage, currentGenerationCount } =
    useImageGeneration();

  // 获取black-and-white-portrait的配置
  const blackAndWhitePortraitConfig = pageExamples.find(
    (item) => item.id === "black-and-white-portrait"
  );

  const [model, setModel] = useState(
    blackAndWhitePortraitConfig?.defaultModel ||
      "gemini-2.5-flash-image-preview"
  );

  // 当模型改变时，如果示例模态框是打开的，更新示例
  useEffect(() => {
    if (exampleStore.isModalOpen) {
      setExampleStore((prev: any) => ({
        ...prev,
        examples: getCurrentModelExamples(),
      }));
    }
  }, [model, exampleStore.isModalOpen]);

  // 根据当前模型获取对应的示例图片
  const getCurrentModelExamples = () => {
    const examples = blackAndWhitePortraitConfig?.examples;
    if (!examples) return [];

    // 获取 general 示例
    if (examples.general && Array.isArray(examples.general)) {
      return examples.general.map((url, index) => ({
        id: `black-and-white-portrait-${index + 1}`,
        url: url,
      }));
    }

    return [];
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.warning(t("global.error.max_generation"));
      return;
    }

    if (!imageForm) {
      toast.error(t("ghibli-style.warning.image"));
      return;
    }

    // 调用prompt函数生成最终的prompt
    const finalPrompt =
      typeof blackAndWhitePortraitConfig?.prompt === "function"
        ? blackAndWhitePortraitConfig.prompt({} as any, model)
        : "";

    await generateWithImage({
      rawPrompt: "",
      prompt: finalPrompt,
      imageData: imageForm,
      shouldUseImageInput: true,
      type: "black-and-white-portrait",
      model,
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* 模型示例图片 */}
      <ModelExampleImage model={model} />
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex w-full flex-col space-y-4 md:w-1/2">
          <Card className="flex h-64 flex-col items-center justify-center">
            <ImageDrop
              previewUrl={previewUrl}
              setPreviewUrl={setPreviewUrl}
              imageForm={imageForm}
              setImageForm={setImageForm}
            />
          </Card>
        </div>

        <div className="mt-4 flex w-full flex-1 flex-col justify-between space-y-12 md:ml-4 md:mt-0 md:w-1/2">
          <div className="space-y-6">
            {/* 模型选择 */}
            <div className="flex items-center">
              <Label htmlFor="model-select" className="w-16">
                {t("common.model")}
              </Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model-select" className="flex-1">
                  <SelectValue placeholder={t("common.model")} />
                </SelectTrigger>
                <SelectContent>
                  {[...models].map((modelOption) => (
                    <SelectItem key={modelOption} value={modelOption}>
                      {modelOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 提示文字 */}
          <div className="flex items-center space-x-3">
            {/* <Label className="w-20 flex-shrink-0 text-right opacity-0">
              {t("common.model")}
            </Label> */}
            <div className="flex-1 text-sm">
              {t("black-and-white-portrait.description")}
            </div>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
            <Button
              onClick={handleGenerate}
              disabled={false}
              className="w-full rounded-md bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 disabled:opacity-50"
            >
              {currentGenerationCount > 0
                ? `${t("global.generate_image")}`
                : t("global.generate_image")}
            </Button>
            <button
              className="text-center text-sm text-purple-500 underline sm:text-left lg:flex-shrink-0"
              onClick={() =>
                setExampleStore((prev: any) => ({
                  ...prev,
                  isModalOpen: true,
                  examples: getCurrentModelExamples(),
                }))
              }
            >
              {t("global.example")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
