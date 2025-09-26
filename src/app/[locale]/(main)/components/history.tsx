import React, { useState, useEffect } from "react";
import Image from "next/image";
import { examples } from "@/constants/examples";
import { useTranslations } from "next-intl";
import HistoryCard from "./history-card";
import { store } from "@/stores";
import { appConfigAtom } from "@/stores/slices/config_store";
import { useFromMulerun } from "@/hooks/useMulerun";

const History = () => {
  const t = useTranslations();
  const { region } = store.get(appConfigAtom);
  const [displayedExamples, setDisplayedExamples] = useState<typeof examples>(
    []
  );
  const { isMulerun } = useFromMulerun();

  const processExamples = () => {
    const processed = examples.map((example) => {
      if (region === 0) {
        return {
          ...example,
          url: example.url.replace("file.302.ai", "file.302ai.cn"),
        };
      }
      return example;
    });
    return processed;
  };

  const refreshExamples = () => {
    const processed = processExamples();
    // Randomly select 20 examples or all if less than 20
    const shuffled = [...processed].sort(() => 0.5 - Math.random());
    setDisplayedExamples(shuffled.slice(0, 20));
  };

  // Initialize examples on component mount
  useEffect(() => {
    refreshExamples();
  }, [region]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-center gap-4">
        <h2 className="font-medium">{t("home.header.more")}</h2>
        {/* <span
          className="cursor-pointer text-sm text-primary underline"
          onClick={refreshExamples}
        >
          {t("home.header.refresh")}
        </span> */}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 px-6 md:grid-cols-5">
        {displayedExamples.map((example) => (
          <HistoryCard
            key={example.id}
            label={example.title}
            url={example.url}
            route={example.route}
          />
        ))}
      </div>
    </div>
  );
};

export default History;
