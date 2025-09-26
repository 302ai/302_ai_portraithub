import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useAtom } from "jotai";
import { exampleStoreAtom } from "@/stores/slices/example_store";
import Image from "next/image";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { appConfigAtom, store } from "@/stores";

const processExamples = (exampleList: any, region?: number) => {
  // 确保 exampleList 是数组
  if (!Array.isArray(exampleList)) {
    return [];
  }

  return exampleList.map((example: any) => {
    if (region === 0) {
      return {
        ...example,
        url:
          typeof example.url === "string"
            ? example.url.replace("file.302.ai", "file.302ai.cn")
            : example.url,
      };
    }
    return example;
  });
};

const ExampleModal = () => {
  const t = useTranslations();
  const [exampleStore, setExampleStore] = useAtom(exampleStoreAtom);
  const onChange = (open: boolean) => {
    setExampleStore((prev) => ({ ...prev, isModalOpen: open }));
  };

  const { region } = store.get(appConfigAtom);

  const processedExamples = processExamples(exampleStore.examples, region);
  return (
    <Dialog open={exampleStore.isModalOpen} onOpenChange={onChange}>
      <DialogContent className="p-6 sm:max-w-3xl">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader>
          <DialogTitle>{t("global.example")}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 grid max-h-[70vh] grid-cols-1 gap-6 overflow-y-auto">
          {/* Image Gallery with consistent aspect ratio */}
          {processedExamples.map((example: any) => (
            <div
              key={example.id}
              className="relative h-[300px] w-full overflow-hidden rounded-lg bg-gray-100"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-full w-full items-center justify-center">
                  <Image
                    src={example.url}
                    alt="English vocabulary cards with illustrations"
                    width={800}
                    height={600}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExampleModal;
