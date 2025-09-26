import React from "react";
import { useTranslations } from "next-intl";
import HistoryPagination from "./history-pagination";
const HistoryModal = () => {
  const t = useTranslations();
  return (
    <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2">
      <h2 className="mb-4 bg-background py-2 text-xl font-bold">
        {t("gallery.title")}
      </h2>
      <HistoryPagination />
    </div>
  );
};

export default HistoryModal;
