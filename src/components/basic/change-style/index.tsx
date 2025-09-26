import { TabsContent } from "@/components/ui/tabs";
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import ImageDrop from "./text/image-drop";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageDesc from "./img/image-desc";
import Text from "./text";
import { useAtom } from "jotai";
import { actionReferenceImagesStoreAtom } from "@/stores/slices/action_reference_images_store";
import { Button } from "@/components/ui/button";
import { appConfigAtom } from "@/stores/slices/config_store";
import { store } from "@/stores";
import { logger } from "@/utils/logger";
import { styleFormAtom } from "@/stores/slices/style_form_store";
import ky from "ky";
import ChangeImage from "./img";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const ChangeStyle = () => {
  const t = useTranslations();
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [actionReferenceImages, setActionReferenceImages] = useAtom(
    actionReferenceImagesStoreAtom
  );

  const setActionImage = (image: string) => {
    setActionReferenceImages({
      ...actionReferenceImages,
      actionImage: image,
    });
  };

  const [styleModificationTab, setStyleModificationTab] = useState<
    "text" | "image"
  >("text");

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* 左侧图片上传 */}
      <Card className="flex h-64 flex-1 flex-col items-center justify-center">
        <ImageDrop
          previewUrl={previewUrl}
          setPreviewUrl={setPreviewUrl}
          imageForm={actionReferenceImages.actionImage}
          setImageForm={setActionImage}
          height="280px"
        />
      </Card>

      {/* 右侧控制区域 */}
      <div className="flex w-full flex-col gap-4 md:w-96">
        <Tabs
          value={styleModificationTab}
          onValueChange={(value) =>
            setStyleModificationTab(value as "text" | "image")
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text"> {t("basic.text")}</TabsTrigger>
            <TabsTrigger value="image">{t("basic.image")}</TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <Text />
          </TabsContent>

          <TabsContent value="image">
            <div className="flex h-full items-center justify-center">
              <ChangeImage />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChangeStyle;
