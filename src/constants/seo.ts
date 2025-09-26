export type SEOData = {
  supportLanguages: string[];
  fallbackLanguage: string;
  languages: Record<
    string,
    { title: string; description: string; image: string }
  >;
};

export const SEO_DATA: SEOData = {
  // TODO: Change to your own support languages
  supportLanguages: ["zh", "en", "ja"],
  fallbackLanguage: "en",
  // TODO: Change to your own SEO data
  languages: {
    zh: {
      title: "AI人像创意站",
      description: "探索GPT-Image-1的多种创意玩法",
      image: "/images/global/desc_zh.png",
    },
    en: {
      title: "AI Image Creative Station",
      description: "Explore various creative gameplay options for GPT-Image-1",
      image: "/images/global/desc_en.png",
    },
    ja: {
      title: "AI 画像クリエイティブステーション",
      description: "GPT-Image-1の多様なアイデアの遊び方を探る",
      image: "/images/global/desc_ja.png",
    },
  },
};
