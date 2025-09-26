"use client";

import React from "react";
import Sidebar from "./sidebar";
import History from "../history";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HistoryIcon } from "lucide-react";
import HistoryModal from "@/components/shared/history-modal";
import { usePathname } from "next/navigation";
import { appConfigAtom } from "@/stores/slices/config_store";
import { store } from "@/stores";

const examples = [
  {
    id: 1,
    route: "studio-portrait",
    img: "https://file.302.ai/gpt/imgs/20250919/7cc563f09f85520fe8b40bb5337deb5d.jpg",
    height: 48,
  },
];

// Process examples based on region
const processExamples = (exampleList: typeof examples, region?: number) => {
  return exampleList.map((example) => {
    if (region === 0) {
      return {
        ...example,
        img: example.img.replace("file.302.ai", "file.302ai.cn"),
      };
    }
    return example;
  });
};

// 根据路由匹配对应的图片和高度信息
const getExampleByRoute = (route: string, region?: number) => {
  const processedExamples = processExamples(examples, region);
  return processedExamples.find((example) => example.route === route);
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const currentRoute = pathname.split("/").pop() || "";
  const { region } = store.get(appConfigAtom);
  const matchedExample = getExampleByRoute(currentRoute, region);
  const matchedImage = matchedExample?.img;
  const imageHeight = matchedExample?.height || 48; // Default to 48 if not specified

  // 对于这些路由，不显示默认的示例图片，因为它们有自己的动态示例图片组件
  const routesWithCustomExamples = [
    "professional-portrait",
    "studio-portrait",
    "id-photo-normal",
  ];
  const shouldShowDefaultImage =
    !routesWithCustomExamples.includes(currentRoute);

  return (
    <div className="relative flex h-full w-full">
      <Sidebar />
      <div className="h-full flex-1">
        <div className="absolute right-0">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost">
                <HistoryIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <HistoryModal />
            </DialogContent>
          </Dialog>
        </div>
        {matchedImage && shouldShowDefaultImage && (
          <div className="flex justify-center">
            <div className="relative inline-block">
              <img
                src={matchedImage}
                alt="Preview"
                className={`h-${imageHeight} w-auto rounded-md`}
                style={{ maxWidth: "220px" }}
              />
            </div>
          </div>
        )}
        {children}
        <History />
      </div>
    </div>
  );
};

export default Layout;
