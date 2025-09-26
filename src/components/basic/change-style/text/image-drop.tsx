"use client";
import { useAtom } from "jotai";
import { ArrowDownUp, Loader2, Upload, UploadIcon, X } from "lucide-react";
import React, { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslations } from "next-intl";
import ky from "ky";
import { env } from "@/env";
import { appConfigAtom, store } from "@/stores";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageDropProps {
  previewUrl: string;
  setPreviewUrl: any;
  imageForm: any;
  setImageForm: any;
  isAutoGenPrompt?: boolean;
  height?: string;
  width?: string;
  className?: string;
}

function ImageDrop({
  previewUrl,
  setPreviewUrl,
  imageForm,
  setImageForm,
  isAutoGenPrompt = false,
  height = "300px", // Default fixed height
  width, // Optional width
  className, // Optional additional classes
}: ImageDropProps) {
  const t = useTranslations();
  const [isUploading, setIsUploading] = useState(false);
  const { apiKey } = store.get(appConfigAtom);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      try {
        setIsUploading(true);
        const file = acceptedFiles[0];

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
          setImageForm(response.data.url);
          setIsUploading(false);
          if (isAutoGenPrompt) {
          }
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
    },
    [imageForm, setImageForm]
  );

  const handleDeleteImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent triggering the dropzone click event
    setImageForm("");
    setPreviewUrl("");
  };

  const handleReplaceClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // 阻止事件冒泡
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onDrop([file]);
      e.target.value = "";
    }
  };

  const displayImage = previewUrl || "";

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
    },
    multiple: false,
    noClick: !!displayImage,
    noKeyboard: !!displayImage,
  });

  return (
    <div
      className={cn("flex w-full flex-col", className)}
      style={{ height, width }}
    >
      <div
        {...(displayImage ? {} : getRootProps())}
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center dark:bg-gray-900"
      >
        {!displayImage && <input {...getInputProps()} />}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png"
          className="hidden"
        />

        {isUploading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : displayImage ? (
          <div className="relative h-full w-full">
            <Image
              src={displayImage}
              alt="Uploaded preview"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 256px"
              priority
            />

            <div className="absolute right-2 top-2 z-10 flex gap-1">
              <button
                className="rounded-full bg-black/40 p-1.5 backdrop-blur-sm transition-all hover:bg-black/60"
                onClick={handleReplaceClick}
                // title={t("actions.replace_image") || "Replace image"}
                // disabled={genState.isGeneratingPrompt}
              >
                <Upload
                  size={16}
                  className={cn(
                    "text-white"
                    // genState.isGeneratingPrompt && "cursor-not-allowed"
                  )}
                />
              </button>
              <button
                onClick={handleDeleteImage}
                className="rounded-full bg-black/40 p-1.5 backdrop-blur-sm transition-all hover:bg-black/60"
                // title={t("actions.delete_image") || "Delete image"}
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4">
            <div className="mb-1">
              <UploadIcon size={40} className="text-gray-400" />
            </div>
            <p className="mb-2 text-sm font-medium">{t("file.drop_file")}</p>
            <p className="mb-1 text-xs font-medium">{t("file.or")}</p>
            <p className="mb-1 text-xs font-medium">{t("file.upload_file")}</p>
            <p className="text-xs text-gray-400">{t("file.support")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageDrop;
