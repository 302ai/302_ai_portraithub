import { useTranslations } from "next-intl";
import React from "react";

const Title = () => {
  const t = useTranslations();
  return (
    <div className="flex items-center justify-between">
      <div className="mx-auto mb-8 max-w-xl rounded-xl p-4 text-center">
        <p className="text-gray-700">{t("home.header.description")}</p>
      </div>
    </div>
  );
};

export default Title;
