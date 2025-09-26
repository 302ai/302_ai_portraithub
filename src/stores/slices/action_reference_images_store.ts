import { atomWithStorage, createJSONStorage } from "jotai/utils";

type ActionReferenceImagesStore = {
  actionImage: string;
  referenceImage: string;
  activeImageId: number | null;
};

export const actionReferenceImagesStoreAtom =
  atomWithStorage<ActionReferenceImagesStore>(
    "actionReferenceImagesStore",
    {
      actionImage: "",
      referenceImage: "",
      activeImageId: null,
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
