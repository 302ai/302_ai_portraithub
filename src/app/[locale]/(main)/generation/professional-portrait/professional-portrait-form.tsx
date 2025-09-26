"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import { ExampleStore, exampleStoreAtom } from "@/stores/slices/example_store";
import { examples } from "./examples";
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

export default function ProfessionalPortraitForm() {
  const t = useTranslations();
  const [exampleStore, setExampleStore] = useAtom(exampleStoreAtom);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageForm, setImageForm] = useState("");
  const { canGenerate, generateWithImage, currentGenerationCount } =
    useImageGeneration();

  // 获取professional-portrait的配置
  const professionalPortraitConfig = pageExamples.find(
    (item) => item.id === "professional-portrait"
  );

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [model, setModel] = useState(
    professionalPortraitConfig?.defaultModel || "gemini-2.5-flash-image-preview"
  );

  // 初始化表单数据
  useEffect(() => {
    const initialData: Record<string, string> = {};
    professionalPortraitConfig?.parameters?.forEach((param) => {
      initialData[param.key] =
        (param as any).defaultValue ||
        (param.type === "color-picker" ? "#FFFFFF" : "");
    });
    setFormData(initialData);
  }, [professionalPortraitConfig]);

  // 当模型改变时，如果示例模态框是打开的，更新示例
  useEffect(() => {
    if (exampleStore.isModalOpen) {
      setExampleStore((prev: any) => ({
        ...prev,
        examples: getCurrentModelExamples(),
      }));
    }
  }, [model, exampleStore.isModalOpen]);

  // 更新表单数据的函数
  const updateFormData = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // 根据当前模型获取对应的示例图片
  const getCurrentModelExamples = () => {
    const examples = professionalPortraitConfig?.examples;
    if (!examples) return [];

    // 如果当前模型有对应的示例，返回该模型的示例
    if (model in examples) {
      const modelExamples = examples[model as keyof typeof examples];
      if (Array.isArray(modelExamples) && modelExamples.length > 0) {
        // 将 URL 字符串数组转换为带有 id 和 url 的对象数组，以兼容 ExampleModal
        return modelExamples.map((url, index) => ({
          id: `${model}-${index + 1}`,
          url: url,
        }));
      }
    }

    // 如果当前模型没有对应的示例，返回通用示例
    if (examples.general && Array.isArray(examples.general)) {
      return examples.general.map((url, index) => ({
        id: `general-${index + 1}`,
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

    // 处理表单数据，为空字段使用placeholder值
    const processedFormData = { ...formData };
    professionalPortraitConfig?.parameters?.forEach((param) => {
      if (
        !processedFormData[param.key] ||
        processedFormData[param.key].trim() === ""
      ) {
        const placeholderText = t(param.placeholder || "");
        processedFormData[param.key] = placeholderText.replace(
          /^e\.g\.\s*/i,
          ""
        );
      }
    });

    // 调用prompt函数生成最终的prompt，传入model参数
    const finalPrompt =
      typeof professionalPortraitConfig?.prompt === "function"
        ? professionalPortraitConfig.prompt(processedFormData as any, model)
        : "";

    await generateWithImage({
      rawPrompt: "",
      prompt: finalPrompt,
      imageData: imageForm,
      shouldUseImageInput: true,
      type: "professional-portrait",
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
            {/* 动态生成表单参数 */}
            {professionalPortraitConfig?.parameters?.map((param) => {
              const value = formData[param.key] || "";

              if (param.type === "select") {
                return (
                  <div key={param.key} className="flex items-center space-x-3">
                    <Label
                      htmlFor={param.key}
                      className="w-20 flex-shrink-0 text-right"
                    >
                      {t(`professional-portrait.label.${param.key}`)}
                    </Label>
                    <Select
                      value={value}
                      onValueChange={(newValue) =>
                        updateFormData(param.key, newValue)
                      }
                    >
                      <SelectTrigger id={param.key} className="flex-1">
                        <SelectValue
                          placeholder={t(
                            `professional-portrait.placeholder.${param.key}`
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {((param as any).options || []).map(
                          (option: string) => (
                            <SelectItem key={option} value={option}>
                              {t(`professional-portrait.option.${option}`)}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }

              return null;
            })}

            {/* 模型选择 */}
            <div className="flex items-center space-x-3">
              <Label
                htmlFor="model-select"
                className="w-20 flex-shrink-0 text-right"
              >
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

          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
            <Button
              onClick={handleGenerate}
              disabled={false}
              className="w-full rounded-md bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 disabled:opacity-50"
            >
              {currentGenerationCount > 0
                ? `${t("global.generate_image")} `
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
