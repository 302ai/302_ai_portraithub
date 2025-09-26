"use client";
import React, { useState } from "react";
import { useAtom } from "jotai";
import ImageUpload from "../text/image-upload";
import { Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { referenceImageStoreAtom } from "@/stores/slices/reference_image_store";
import { appConfigAtom } from "@/stores/slices/config_store";
import { useHistory } from "@/hooks/db/use-gen-history";
import { store } from "@/stores";
import { actionReferenceImagesStoreAtom } from "@/stores/slices/action_reference_images_store";
import { useReferenceImages } from "@/hooks/db/use-reference-images";

const ImageDesc = () => {
  const [actionReferenceImage, setActionReferenceImage] = useAtom(
    actionReferenceImagesStoreAtom
  );
  const { referenceImages, deleteReferenceImage } = useReferenceImages();

  const t = useTranslations();
  // const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  const handleDeleteImage = (
    id: number,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (actionReferenceImage.activeImageId === id) {
      setActionReferenceImage({
        ...actionReferenceImage,
        activeImageId: null,
      });
    }

    deleteReferenceImage(id);

    setActionReferenceImage({
      ...actionReferenceImage,
      referenceImage: "",
    });
  };
  const handleImageClick = (id: number) => {
    const isDeselecting = id === actionReferenceImage.activeImageId;

    setActionReferenceImage({
      ...actionReferenceImage,
      activeImageId: isDeselecting ? null : id,
      referenceImage: isDeselecting
        ? ""
        : referenceImages?.items.find((img) => img.id === id)?.url || "",
    });
  };

  return (
    <div className="relative h-auto min-h-[250px] w-full overflow-y-auto md:h-[300px]">
      <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 md:gap-1 md:p-1">
        {/* First slot for image upload component */}
        <div className="relative aspect-square overflow-hidden rounded-lg">
          <ImageUpload />
        </div>

        {/* Reference images */}
        {referenceImages?.items?.map((image: any) => (
          <div
            key={image.id}
            className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg ${
              actionReferenceImage.activeImageId === image.id
                ? "ring-2 ring-primary"
                : "ring-2 ring-transparent"
            }`}
            onClick={() => handleImageClick(image.id)}
          >
            <img
              src={image.url}
              alt={`Reference ${image.id}`}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
            {image.isUserUploaded && (
              <button
                onClick={(e) => handleDeleteImage(image.id, e)}
                className="absolute right-0 top-0 rounded-full bg-white bg-opacity-70 p-1 transition-all hover:bg-opacity-100 dark:bg-gray-800 dark:bg-opacity-70 dark:hover:bg-opacity-100"
                title={t("actions.delete_image") || "Delete image"}
              >
                <Trash size={16} className="text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageDesc;
