"use client";

import { useRouter } from "next/navigation";

import { useLocale, useTranslations } from "next-intl";

export default function HistoryCard({
  label,
  url,
  route,
}: {
  label: string;
  url: string;
  route: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  return (
    <div className="flex flex-col items-center justify-center">
      <p className="mb-2 text-sm text-gray-400">{t(`sidebar.${label}`)}</p>
      <div className="flex aspect-[3/4] cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-300">
        <div className="relative w-full flex-1 transition-all duration-300 hover:scale-105">
          <img
            src={url}
            alt={label}
            className="h-full w-full rounded-lg object-cover"
            onClick={() => router.push(`/${locale}${route}`)}
          />
        </div>
      </div>
    </div>
  );
}
