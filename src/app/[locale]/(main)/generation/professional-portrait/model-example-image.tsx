"use client";

import React from "react";
import { pageExamples } from "@/constants/page-examples";

interface ModelExampleImageProps {
  model: string;
}

const ModelExampleImage: React.FC<ModelExampleImageProps> = ({ model }) => {
  const professionalPortraitConfig = pageExamples.find(
    (item) => item.id === "professional-portrait"
  );

  // 获取当前模型对应的第一张示例图片
  const getExampleImage = () => {
    const examples = professionalPortraitConfig?.examples;
    if (!examples) return null;

    // 根据模型获取对应的示例图片数组，取第一张
    if (model in examples) {
      const modelExamples = examples[model as keyof typeof examples];
      if (Array.isArray(modelExamples) && modelExamples.length > 0) {
        return modelExamples[0];
      }
    }

    // 如果当前模型没有对应的示例，返回通用示例的第一张
    if (examples.general && Array.isArray(examples.general)) {
      return examples.general[0];
    }

    return null;
  };

  const exampleImage = getExampleImage();

  if (!exampleImage) {
    return null;
  }

  return (
    <div className="mb-6 flex justify-center">
      <div className="relative inline-block">
        <img
          src={exampleImage}
          alt="Model Example"
          className="h-48 w-auto rounded-md"
          style={{ maxWidth: "220px" }}
        />
      </div>
    </div>
  );
};

export default ModelExampleImage;
