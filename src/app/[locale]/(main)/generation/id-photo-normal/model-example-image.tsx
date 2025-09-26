"use client";

import React from "react";
import { pageExamples } from "@/constants/page-examples";

interface ModelExampleImageProps {
  model: string;
  photoType: "normal" | "american";
}

const ModelExampleImage: React.FC<ModelExampleImageProps> = ({
  model,
  photoType,
}) => {
  const currentConfig = pageExamples.find(
    (item) =>
      item.id ===
      (photoType === "normal" ? "id-photo-normal" : "id-photo-american")
  );

  // 获取示例图片
  const getExampleImage = () => {
    const examples = currentConfig?.examples;
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
          alt={
            photoType === "normal"
              ? "ID Photo Example"
              : "American ID Photo Example"
          }
          className="h-48 w-auto rounded-md"
          style={{ maxWidth: "220px" }}
        />
      </div>
    </div>
  );
};

export default ModelExampleImage;
