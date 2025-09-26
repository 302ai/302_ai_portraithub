"use client";
import React, { useState, useRef } from "react";
import { useAtom } from "jotai";
import { referenceImageStoreAtom } from "@/stores/slices/reference_image_store";
import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import ky from "ky";
import { env } from "@/env";
import { useReferenceImages } from "@/hooks/db/use-reference-images";
const ImageUpload = () => {
  const t = useTranslations();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  // const [referenceState, setReferenceState] = useAtom(referenceImageStoreAtom);
  const { referenceImages, addReferenceImage } = useReferenceImages();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const file = files[0];

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

      // Upload the image
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
        // Add to reference images at the beginning of the array
        // setReferenceState({
        //   ...referenceState,
        //   referenceImages: [
        //     {
        //       id: Date.now(), // Generate a unique ID
        //       url: response.data.url,
        //       isUserUploaded: true,
        //     },
        //     ...referenceState.referenceImages,
        //   ],
        // });
        const newImageId = Date.now();
        addReferenceImage(response.data.url, newImageId);
      } else {
        console.error("Upload failed:", response.msg);
        setPreviewUrl("");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setPreviewUrl("");
    } finally {
      setIsUploading(false);
      // Reset file input value
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="relative flex aspect-square h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-solid border-gray-300 bg-white text-center dark:bg-gray-900"
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png"
        style={{ display: "none" }}
      />

      {isUploading ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center p-4">
          <Plus size={24} className="text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
