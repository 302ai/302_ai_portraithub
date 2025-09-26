import { atomWithStorage, createJSONStorage } from "jotai/utils";

type ReferenceImageStore = {
  referenceImages: {
    id: number;
    url: string;
    isUserUploaded: boolean;
  }[];
};

export const referenceImageStoreAtom = atomWithStorage<ReferenceImageStore>(
  "referenceImageStore",
  {
    referenceImages: [
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
    ],
  },
  createJSONStorage(() =>
    typeof window !== "undefined"
      ? sessionStorage
      : {
          getItem: () => null,
          setItem: () => null,
          removeItem: () => null,
        }
  ),
  {
    getOnInit: true,
  }
);
