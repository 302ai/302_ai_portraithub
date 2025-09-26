"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { createScopedLogger } from "@/utils/logger";
import TextToImage from "@/components/basic/text-to-image";
import { Textarea } from "@/components/ui/textarea";
import ChangeStyle from "@/components/basic/change-style";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import StyleModification from "@/components/basic/style-modification";
const logger = createScopedLogger("Home");

export default function Home() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("text2img");

  // 检测URL参数，如果有图片则跳转到风格修改tab
  useEffect(() => {
    const imageParam = searchParams.get("image");
    if (imageParam) {
      setActiveTab("styleModification");
    }
  }, [searchParams]);

  return (
    <div className="">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 ml-4">
          <TabsTrigger value="text2img">{t("basic.text2img")}</TabsTrigger>
          {/* <TabsTrigger value="styleEdit">{t("basic.styleEdit")}</TabsTrigger> */}
          <TabsTrigger value="styleModification">
            {t("basic.styleModification")}
          </TabsTrigger>
        </TabsList>

        <div className="flex justify-center">
          <TabsContent value="text2img" className="w-full max-w-3xl">
            <TextToImage />
          </TabsContent>

          {/* <TabsContent value="styleEdit" className="w-full max-w-3xl">
            <ChangeStyle />
          </TabsContent> */}

          <TabsContent value="styleModification" className="w-full max-w-3xl">
            <StyleModification />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
