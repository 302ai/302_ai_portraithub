import { atomWithStorage, createJSONStorage } from "jotai/utils";

type StyleForm = {
  image: string;
  prompt: string;
  open: boolean;
};

export const styleFormAtom = atomWithStorage<StyleForm>(
  "styleForm",
  {
    image: "",
    open: false,
    prompt: "",
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
