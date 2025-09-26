import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type UiStore = {
  activeTab: string;
};

const STORAGE_KEY = "uiStore";
const defaultState: UiStore = {
  activeTab: "",
};

const createStorage = () => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => null,
      removeItem: () => null,
    };
  }
  const existingData = sessionStorage.getItem(STORAGE_KEY);
  if (!existingData) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
  }

  return sessionStorage;
};

export const uiStoreAtom = atomWithStorage<UiStore>(
  STORAGE_KEY,
  defaultState,
  createJSONStorage(() => createStorage()),
  {
    getOnInit: true,
  }
);
