import ky, { HTTPError } from "ky";
import { emitter } from "@/utils/mitt";
import { store, languageAtom } from "@/stores";
import { langToCountry } from "@/utils/302";

interface GenerateEnglishCardParams {
  words: string;
  apiKey: string;
  model?: string;
  mulerunSessionId?: string;
  isMulerun?: boolean;
  agentId?: string;
}

interface GenerateEnglishCardResult {
  image: {
    image: string;
    prompt: string;
    model: string;
  };
}

export const generateEnglishCard = async ({
  words,
  apiKey,
  model = "gpt-image-1",
  mulerunSessionId,
  isMulerun,
  agentId,
}: GenerateEnglishCardParams) => {
  try {
    const res = await ky.post("/api/gen-english-card", {
      timeout: 300000,
      json: {
        words,
        apiKey,
        model,
        mulerunSessionId,
        isMulerun,
        agentId,
      },
    });
    return res.json<GenerateEnglishCardResult>();
  } catch (error) {
    if (error instanceof Error) {
      const uiLanguage = store.get(languageAtom);

      if (error instanceof HTTPError) {
        try {
          const errorData = JSON.parse((await error.response.json()) as string);
          if (errorData.error && uiLanguage) {
            const countryCode = langToCountry(uiLanguage);
            const messageKey =
              countryCode === "en" ? "message" : `message_${countryCode}`;
            const message = errorData.error[messageKey];
            emitter.emit("ToastError", {
              code: errorData.error.err_code,
              message,
            });
          }
        } catch {
          // If we can't parse the error response, show a generic error
          emitter.emit("ToastError", {
            code: error.response.status,
            message: error.message,
          });
        }
      } else {
        // For non-HTTP errors
        emitter.emit("ToastError", {
          code: 500,
          message: error.message,
        });
      }
    }
    throw error; // Re-throw the error for the caller to handle if needed
  }
};
