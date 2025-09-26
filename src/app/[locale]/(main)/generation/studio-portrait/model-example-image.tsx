"use client";

import React from "react";
import { pageExamples } from "@/constants/page-examples";

interface ModelExampleImageProps {
  model: string;
}

const ModelExampleImage: React.FC<ModelExampleImageProps> = ({ model }) => {
  const studioPortraitConfig = pageExamples.find(
    (item) => item.id === "studio-portrait"
  );

  // 获取示例图片 (studio-portrait 只有 general 示例)
  const getExampleImage = () => {
    const examples = studioPortraitConfig?.examples;
    if (!examples || !examples.general || !Array.isArray(examples.general)) {
      return null;
    }

    return examples.general[0]; // 取第一张图片
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
          alt="Studio Portrait Example"
          className="h-48 w-auto rounded-md"
          style={{ maxWidth: "220px" }}
        />
      </div>
    </div>
  );
};

export default ModelExampleImage;
