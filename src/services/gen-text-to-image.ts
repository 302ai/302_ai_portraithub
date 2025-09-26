import { languageAtom, store } from "@/stores";
import { langToCountry } from "@/utils/302";
import { emitter } from "@/utils/mitt";
import ky, { HTTPError } from "ky";

interface CreateTextToImageParams {
  apiKey: string;
  prompt: string;
  actionImage: string;
}

interface CreateTextToImageResult {
  image: {
    image: string;
    imageUrl?: string;
    prompt: string;
    uploadError?: string;
  };
}

export const createTextToImage = async ({
  apiKey,
  prompt,
  actionImage,
}: CreateTextToImageParams) => {
  try {
    const res = await ky.post<CreateTextToImageResult>("/api/text-to-image", {
      timeout: 300000,
      json: {
        prompt,
        apiKey,
        actionImage,
      },
    });
    const data = await res.json();
    return data;
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
