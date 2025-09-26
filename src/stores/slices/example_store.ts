// import { WorkflowType } from "@/type";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type ExampleStore = {
  examples: any[];
  isModalOpen: boolean;
};

const STORAGE_KEY = "ExampleStore";
const defaultState: ExampleStore = {
  examples: [],
  isModalOpen: false,
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

export const exampleStoreAtom = atomWithStorage<ExampleStore>(
  STORAGE_KEY,
  defaultState,
  createJSONStorage(() => createStorage()),
  {
    getOnInit: true,
  }
);
