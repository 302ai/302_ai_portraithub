"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
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
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
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

export default function StudioPortraitForm() {
  const t = useTranslations();
  const [exampleStore, setExampleStore] = useAtom(exampleStoreAtom);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageForm, setImageForm] = useState("");
  const { canGenerate, generateWithImage, currentGenerationCount } =
    useImageGeneration();
  // 获取studio-portrait的配置
  const studioPortraitConfig = pageExamples.find(
    (item) => item.id === "studio-portrait"
  );

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [model, setModel] = useState(
    studioPortraitConfig?.defaultModel || "gemini-2.5-flash-image-preview"
  );

  // 初始化表单数据
  useEffect(() => {
    const initialData: Record<string, string> = {};
    studioPortraitConfig?.parameters?.forEach((param) => {
      initialData[param.key] =
        (param as any).defaultValue ||
        (param.type === "color-picker" ? "#FFFFFF" : "");
    });
    setFormData(initialData);
  }, [studioPortraitConfig]);

  // 更新表单数据的函数
  const updateFormData = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // 根据当前模型获取对应的示例图片 (studio-portrait 只有 general 示例)
  const getCurrentModelExamples = () => {
    const examples = studioPortraitConfig?.examples;
    if (!examples) return [];

    // 将 URL 字符串数组转换为带有 id 和 url 的对象数组，以兼容 ExampleModal
    if (examples.general && Array.isArray(examples.general)) {
      return examples.general.map((url, index) => ({
        id: index + 1,
        url: url,
      }));
    }

    return [];
  };
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorBoxRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭颜色选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        colorBoxRef.current &&
        !colorPickerRef.current.contains(event.target as Node) &&
        !colorBoxRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleColorPicker = () => {
    setShowColorPicker(!showColorPicker);
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

    // 处理表单数据，如果用户没有填写内容，使用placeholder的国际化作为默认值
    const processedFormData: Record<string, string> = {};
    studioPortraitConfig?.parameters?.forEach((param) => {
      const userValue = formData[param.key] || "";
      if (userValue.trim() === "") {
        // 获取placeholder的国际化文本并移除"e.g."前缀
        const placeholderText = t(`studio-portrait.placeholder.${param.key}`);
        processedFormData[param.key] = placeholderText.replace(
          /^e\.g\.\s*/i,
          ""
        );
      } else {
        processedFormData[param.key] = userValue;
      }
    });

    // 调用prompt函数生成最终的prompt
    const finalPrompt =
      typeof studioPortraitConfig?.prompt === "function"
        ? studioPortraitConfig.prompt(processedFormData as any, model)
        : "";

    await generateWithImage({
      rawPrompt: "",
      prompt: finalPrompt,
      imageData: imageForm,
      shouldUseImageInput: true,
      type: "studio-portrait",
      model,
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* 示例图片 */}
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
            {studioPortraitConfig?.parameters?.map((param) => {
              const value = formData[param.key] || "";

              if (param.type === "text") {
                return (
                  <div key={param.key} className="space-y-2">
                    <Label htmlFor={param.key}>
                      {t(`studio-portrait.label.${param.key}`)}
                    </Label>
                    <Input
                      id={param.key}
                      value={value}
                      onChange={(e) =>
                        updateFormData(param.key, e.target.value)
                      }
                      placeholder={t(
                        `studio-portrait.placeholder.${param.key}`
                      )}
                    />
                  </div>
                );
              }

              if (param.type === "textarea") {
                return (
                  <div key={param.key} className="space-y-2">
                    <Label htmlFor={param.key}>
                      {t(`studio-portrait.label.${param.key}`)}
                    </Label>
                    <Textarea
                      id={param.key}
                      value={value}
                      onChange={(e) =>
                        updateFormData(param.key, e.target.value)
                      }
                      placeholder={t(
                        `studio-portrait.placeholder.${param.key}`
                      )}
                      className="min-h-[80px]"
                    />
                  </div>
                );
              }

              if (param.type === "color-picker") {
                return (
                  <div key={param.key} className="space-y-2">
                    <Label htmlFor={param.key}>
                      {t(`studio-portrait.label.${param.key}`)}
                    </Label>
                    <div className="flex items-center space-x-3">
                      <Input
                        id={param.key}
                        type="text"
                        value={value}
                        onChange={(e) =>
                          updateFormData(param.key, e.target.value)
                        }
                        className="flex-1"
                        placeholder={t(
                          `studio-portrait.placeholder.${param.key}`
                        )}
                      />
                      <div
                        ref={colorBoxRef}
                        className="h-10 w-10 cursor-pointer rounded-full border border-solid border-gray-300"
                        style={{ backgroundColor: value }}
                        onClick={toggleColorPicker}
                      ></div>
                    </div>
                    {showColorPicker && (
                      <div
                        ref={colorPickerRef}
                        className="absolute right-0 z-10 mt-2"
                      >
                        <div className="rounded-md border border-solid border-gray-200 bg-white p-3 shadow-lg">
                          <div className="mb-2 text-sm font-medium">
                            {t(`studio-portrait.label.${param.key}`)}
                          </div>
                          <HexColorPicker
                            color={value}
                            onChange={(color) =>
                              updateFormData(param.key, color)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })}

            {/* 模型选择 */}
            <div className="space-y-2">
              <Label htmlFor="model-select">{t("common.model")}</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model-select">
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
