import { atomWithStorage, createJSONStorage } from "jotai/utils";

type EditImageStore = {
  imageToEdit: string;
};

export const editImageStoreAtom = atomWithStorage<EditImageStore>(
  "editImageStore",
  {
    imageToEdit: "",
  },
  createJSONStorage(() =>
    typeof window !== "undefined"
      ? sessionStorage
      : {
          getItem: () => null,
          setItem: () => null,
          removeItem: () => null,
        }
  )
);
