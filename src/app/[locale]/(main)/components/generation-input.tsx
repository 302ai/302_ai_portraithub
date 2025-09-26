"use client";
import { Search, Upload, Loader2, X, Sparkles } from "lucide-react";
import React, { useState, FormEvent, useRef } from "react";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { models, imageEditModels } from "@/constants/models";
import ky from "ky";
import { env } from "@/env";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const GenerationInput = () => {
  const t = useTranslations();
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState(
    "gemini-2.5-flash-image-preview"
  );
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const locale = params.locale as string;

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);

      // Create preview immediately for better UX
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setPreviewUrl(result);
        }
      };
      reader.readAsDataURL(file);

      // Create form data for the API
      const formData = new FormData();
      formData.append("file", file);

      const response = await ky
        .post(`${env.NEXT_PUBLIC_AUTH_API_URL}/gpt/api/upload/gpt/image`, {
          body: formData,
        })
        .json<{
          code: number;
          msg: string;
          data: {
            url: string;
          };
        }>();

      if (response.code === 0) {
        setUploadedImageUrl(response.data.url);
      } else {
        console.error("Upload failed:", response.msg);
        setPreviewUrl("");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setPreviewUrl("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
      e.target.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteImage = () => {
    setUploadedImageUrl("");
    setPreviewUrl("");
    setIsUploading(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const baseUrl = `/${locale}/generation/basic?prompt=${encodeURIComponent(inputValue.trim())}&model=${encodeURIComponent(selectedModel)}`;
      const finalUrl = uploadedImageUrl
        ? `${baseUrl}&image=${encodeURIComponent(uploadedImageUrl)}`
        : baseUrl;
      window.location.href = finalUrl;
    }
  };

  return (
    <div className="mb-12">
      <form onSubmit={handleSubmit} className="relative mx-auto max-w-2xl">
        <div className="flex items-center space-x-2">
          {/* Image Upload Button */}
          <div className="relative flex h-[80px] w-[80px] items-center justify-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png"
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative h-[80px] w-[80px]">
                <Image
                  src={previewUrl}
                  alt="Uploaded preview"
                  fill
                  className="rounded-lg object-cover"
                  sizes="80px"
                />
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="flex h-[42px] w-[42px] items-center justify-center rounded-lg border border-solid border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                ) : (
                  <Upload size={20} className="text-gray-400" />
                )}
              </button>
            )}
          </div>

          <div className="w-36">
            <Select
              value={selectedModel}
              onValueChange={(value) => setSelectedModel(value)}
            >
              <SelectTrigger className="h-[42px] border border-solid border-gray-300 text-sm">
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent>
                {[...models, ...imageEditModels].map((model) => (
                  <SelectItem
                    key={model}
                    value={model}
                    disabled={model === "SeedEdit 3.0" && !uploadedImageUrl}
                  >
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative flex-1 md:min-w-[380px]">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t("home.header.placeholder")}
              className="w-full rounded-lg border border-solid border-gray-300 px-4 py-5 pr-12 text-sm"
            />
          </div>

          <Button
            type="submit"
            className="h-[36px] px-3 text-xs"
            disabled={!inputValue.trim()}
          >
            <Sparkles className="mr-1 h-3 w-3" />
            {t("global.generate_image")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GenerationInput;
