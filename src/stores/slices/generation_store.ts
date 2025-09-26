// import { WorkflowType } from "@/type";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type GenerationStore = {
  generationCount: number;
  loading: boolean;
};

const STORAGE_KEY = "GenerationStore";
const defaultState: GenerationStore = {
  generationCount: 0,
  loading: false,
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

export const generationStoreAtom = atomWithStorage<GenerationStore>(
  STORAGE_KEY,
  defaultState,
  createJSONStorage(() => createStorage()),
  {
    getOnInit: true,
  }
);
