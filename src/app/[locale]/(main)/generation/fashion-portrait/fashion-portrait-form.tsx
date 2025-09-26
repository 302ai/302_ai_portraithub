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
import { Textarea } from "@/components/ui/textarea";
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

export default function FashionPortraitForm() {
  const t = useTranslations();
  const [exampleStore, setExampleStore] = useAtom(exampleStoreAtom);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageForm, setImageForm] = useState("");
  const { canGenerate, generateWithImage, currentGenerationCount } =
    useImageGeneration();

  // 获取fashion-portrait的配置
  const fashionPortraitConfig = pageExamples.find(
    (item) => item.id === "fashion-portrait"
  );

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [model, setModel] = useState(
    fashionPortraitConfig?.defaultModel || "doubao-seedream-4-0-250828"
  );

  // 初始化表单数据
  useEffect(() => {
    const initialData: Record<string, string> = {};
    fashionPortraitConfig?.parameters?.forEach((param) => {
      initialData[param.key] = (param as any).defaultValue || "";
    });
    setFormData(initialData);
  }, [fashionPortraitConfig]);

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
    const examples = fashionPortraitConfig?.examples;
    if (!examples) return [];

    // 获取 general 示例
    if (examples.general && Array.isArray(examples.general)) {
      return examples.general.map((url, index) => ({
        id: `fashion-portrait-${index + 1}`,
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

    // 处理表单数据，为空字段使用合适的默认值
    const processedFormData = { ...formData };
    fashionPortraitConfig?.parameters?.forEach((param) => {
      if (
        !processedFormData[param.key] ||
        processedFormData[param.key].trim() === ""
      ) {
        if (param.key === "other_requirements") {
          // other_requirements 为空时传"无"
          processedFormData[param.key] = "无";
        } else if (param.defaultValue && param.defaultValue !== "") {
          // 有非空 defaultValue 的使用 defaultValue（如 gender: "male"）
          processedFormData[param.key] = param.defaultValue;
        } else {
          // 其他字段使用国际化的 placeholder 值
          const placeholderKey = `fashion-portrait.placeholder.${param.key}`;
          const placeholderText = t(placeholderKey);
          processedFormData[param.key] = placeholderText.replace(
            /^e\.g\.\s*/i,
            ""
          );
        }
      }
    });

    // 调用prompt函数生成最终的prompt
    const finalPrompt =
      typeof fashionPortraitConfig?.prompt === "function"
        ? fashionPortraitConfig.prompt(processedFormData as any, model)
        : "";

    await generateWithImage({
      rawPrompt: "",
      prompt: finalPrompt,
      imageData: imageForm,
      shouldUseImageInput: true,
      type: "fashion-portrait",
      model,
      isOptimize: fashionPortraitConfig?.shouldUseOptimizePrompt || false,
      customOptimizePrompt: fashionPortraitConfig?.systemPrompt,
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
            {fashionPortraitConfig?.parameters?.map((param) => {
              const value = formData[param.key] || "";

              if (param.type === "select") {
                return (
                  <div key={param.key} className="flex items-center space-x-3">
                    <Label
                      htmlFor={param.key}
                      className="w-24 flex-shrink-0 text-right"
                    >
                      {t(`fashion-portrait.label.${param.key}`)}
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
                            `fashion-portrait.placeholder.${param.key}`
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {((param as any).options || []).map(
                          (option: string) => (
                            <SelectItem key={option} value={option}>
                              {t(`fashion-portrait.option.${option}`)}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }

              if (param.type === "textarea") {
                return (
                  <div key={param.key} className="flex items-start space-x-3">
                    <Label
                      htmlFor={param.key}
                      className="w-24 flex-shrink-0 pt-2 text-right"
                    >
                      {t(`fashion-portrait.label.${param.key}`)}
                    </Label>
                    <Textarea
                      id={param.key}
                      value={value}
                      onChange={(e) =>
                        updateFormData(param.key, e.target.value)
                      }
                      placeholder={t(
                        `fashion-portrait.placeholder.${param.key}`
                      )}
                      className="min-h-[80px] flex-1"
                    />
                  </div>
                );
              }

              return null;
            })}

            {/* 模型选择 */}
            <div className="flex items-center space-x-3">
              <Label
                htmlFor="model-select"
                className="w-24 flex-shrink-0 text-right"
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
