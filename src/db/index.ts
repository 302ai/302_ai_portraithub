import Dexie, { Table } from "dexie";

import { History } from "./types";

const referenceImages = [
  {
    id: 1,
    url: "https://file.302.ai/gpt/imgs/20250416/d92c3067c066410ba2992c762967c413.jpg",
    isUserUploaded: false,
  },
  {
    id: 2,
    url: "https://file.302.ai/gpt/imgs/20250416/8f4d4377878c4144bccaf57cbf9f60fb.jpg",
    isUserUploaded: false,
  },
  {
    id: 3,
    url: "https://file.302.ai/gpt/imgs/20250403/compressed_dc3134f505dd4c31924718cc3423d75d.jpeg",
    isUserUploaded: false,
  },
  {
    id: 4,
    url: "https://file.302.ai/gpt/imgs/20250416/552b2e924dcb4ed991ddd914bfd2a863.jpg",
    isUserUploaded: false,
  },
  {
    id: 5,
    url: "https://file.302.ai/gpt/imgs/20250416/6fee773bfb8f42f3b944ab25a25c88ed.jpg",
    isUserUploaded: false,
  },
  {
    id: 6,
    url: "https://file.302.ai/gpt/imgs/20250416/faf498b9ca294509a6b88f0f74f9a606.jpg",
    isUserUploaded: false,
  },
  {
    id: 7,
    url: "https://file.302.ai/gpt/imgs/20250416/3d5f12d9e657442783b446b4104e9d8e.jpg",
    isUserUploaded: false,
  },
  {
    id: 8,
    url: "https://file.302.ai/gpt/imgs/20250416/231b2403faa2459fbe350354d41cc7f1.jpg",
    isUserUploaded: false,
  },
  {
    id: 9,
    url: "https://file.302.ai/gpt/imgs/20250416/e9a15acd2cf84303a38f0b56798f547a.jpg",
    isUserUploaded: false,
  },
  {
    id: 10,
    url: "https://file.302.ai/gpt/imgs/20250403/compressed_07df56d9d99f4d3783a6a87fe1407c16.jpeg",
    isUserUploaded: false,
  },
  {
    id: 11,
    url: "https://file.302.ai/gpt/imgs/20250416/5daf21b21a174a6baae346b2aff8c827.jpg",
    isUserUploaded: false,
  },
  {
    id: 12,
    url: "https://file.302.ai/gpt/imgs/20250416/09dfcb4b319b4ad8a40998b12ad6cad9.jpg",
    isUserUploaded: false,
  },
  {
    id: 13,
    url: "https://file.302.ai/gpt/imgs/20250416/23da1d67b6204c76ab9a03605fc138a2.jpg",
    isUserUploaded: false,
  },
  {
    id: 14,
    url: "https://file.302.ai/gpt/imgs/20250416/384cb2b4a5dd4187a8f70f7d2252b7fb.jpg",
    isUserUploaded: false,
  },
  {
    id: 15,
    url: "https://file.302.ai/gpt/imgs/20250416/34d08c9abe164e1bafb8a77023666b1d.jpg",
    isUserUploaded: false,
  },
  {
    id: 16,
    url: "https://file.302.ai/gpt/imgs/20250416/4988f33d62a6481d9526987696790175.jpg",
    isUserUploaded: false,
  },
  {
    id: 17,
    url: "https://file.302.ai/gpt/imgs/20250416/f31f5db6b9e5419bac9cdff8e19269ca.jpg",
    isUserUploaded: false,
  },
  {
    id: 18,
    url: "https://file.302.ai/gpt/imgs/20250416/aa6b4286a3a24a60b0b2e6a65580c064.jpg",
    isUserUploaded: false,
  },
  {
    id: 19,
    url: "https://file.302.ai/gpt/imgs/20250416/03ec6c145a2146a190f681ddc42cc20f.jpg",
    isUserUploaded: false,
  },
  {
    id: 20,
    url: "https://file.302.ai/gpt/imgs/20250416/02ecc8704e794668bfa16654dd74a0af.jpg",
    isUserUploaded: false,
  },
  {
    id: 21,
    url: "https://file.302.ai/gpt/imgs/20250416/26fc59ed843344b181ba835db9eaa402.jpg",
    isUserUploaded: false,
  },
  {
    id: 22,
    url: "https://file.302.ai/gpt/imgs/20250416/8f785792ff1b435ea34643e3eaec3bf2.jpg",
    isUserUploaded: false,
  },
  {
    id: 23,
    url: "https://file.302.ai/gpt/imgs/20250416/dd0171cc75014b6b8daf225574cf6d94.jpg",
    isUserUploaded: false,
  },
  {
    id: 24,
    url: "https://file.302.ai/gpt/imgs/20250423/3ce0f1e8153242b999df5a5c1cd34979.jpg",
    isUserUploaded: false,
  },
  {
    id: 25,
    url: "https://file.302.ai/gpt/imgs/20250423/f8eeb511f148409682c6225559207c1f.jpg",
    isUserUploaded: false,
  },
  {
    id: 26,
    url: "https://file.302.ai/gpt/imgs/20250423/6a735d2e1e3d4f7cb53345fdcf9dab32.jpg",
    isUserUploaded: false,
  },
  {
    id: 27,
    url: "https://file.302.ai/gpt/imgs/20250423/f5138e94193d4bd48974813cf1de87df.jpg",
    isUserUploaded: false,
  },
  {
    id: 28,
    url: "https://file.302.ai/gpt/imgs/20250423/43407bd33dd64c998a30648b1d017c43.jpg",
    isUserUploaded: false,
  },
  {
    id: 29,
    url: "https://file.302.ai/gpt/imgs/20250423/0b06415915c347c98a9fec18bf92afad.jpg",
    isUserUploaded: false,
  },
  {
    id: 30,
    url: "https://file.302.ai/gpt/imgs/20250423/6ce520753cb14578b893be2fbbb8d070.jpg",
    isUserUploaded: false,
  },
  {
    id: 31,
    url: "https://file.302.ai/gpt/imgs/20250423/05cdafc8369d45f8a7f72ad8e922865a.jpg",
    isUserUploaded: false,
  },
  {
    id: 32,
    url: "https://file.302.ai/gpt/imgs/20250423/705e7143687f4e38a23030ad01ea79aa.jpg",
    isUserUploaded: false,
  },
  {
    id: 33,
    url: "https://file.302.ai/gpt/imgs/20250423/bc1622d789d34a4da78377af97a43673.jpg",
    isUserUploaded: false,
  },
  {
    id: 34,
    url: "https://file.302.ai/gpt/imgs/20250423/70d4212c1c91440b9c411e4d5a209b9d.jpg",
    isUserUploaded: false,
  },
  {
    id: 35,
    url: "https://file.302.ai/gpt/imgs/20250423/0a7f95dc108b4aff8a191a6c33d887a7.jpg",
    isUserUploaded: false,
  },
  {
    id: 36,
    url: "https://file.302.ai/gpt/imgs/20250423/d5c47a4c23b94a93ab1468e7311288e1.jpg",
    isUserUploaded: false,
  },
];

interface ReferenceImage {
  id: number;
  url: string;
  isUserUploaded: boolean;
}

class ImageToPromptDB extends Dexie {
  history!: Table<History>;
  styleHistory!: Table<History>;
  referenceImages!: Table<ReferenceImage>;

  constructor() {
    super("gpt-images");
    this.version(1).stores({
      history: "id, rawPrompt, type, createdAt",
      styleHistory: "id, rawPrompt, type, createdAt",
      referenceImages: "id, url, isUserUploaded",
    });
  }
}

export const db = new ImageToPromptDB();

// 初始化参考图片数据
(async () => {
  try {
    // 检查referenceImages表是否为空
    const count = await db.referenceImages.count();
    if (count === 0) {
      // 如果为空，则批量添加初始图片数据
      await db.referenceImages.bulkAdd(referenceImages);
      console.log("Reference images initialized successfully");
    }
  } catch (error) {
    console.error("Failed to initialize reference images:", error);
  }
})();
