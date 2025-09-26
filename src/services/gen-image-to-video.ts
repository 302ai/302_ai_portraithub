import { languageAtom, store } from "@/stores";
import { langToCountry } from "@/utils/302";
import { emitter } from "@/utils/mitt";
import { error } from "console";
import ky, { HTTPError } from "ky";

interface CreateTextToImageParams {
  apiKey: string;
  prompt: string;
  model: string;
  image: string;
  duration?: string;
  mulerunSessionId?: string;
  isMulerun?: boolean;
  agentId?: string;
}

interface CreateTextToImageResult {
  task_id: string;
  status: string;
  message: string;
}

interface PollVideoResult {
  url: string;
  status: string;
  data: {
    task_id: string;
    status: string;
    file_id: string;
    video_width: number;
    video_height: number;
    base_resp: {
      status_code: number;
      status_msg: string;
    };
    file: {
      file_id: number;
      bytes: number;
      created_at: number;
      filename: string;
      purpose: string;
      download_url: string;
    };
  };
}

export const createImageToVideo = async ({
  apiKey,
  prompt,
  model,
  image,
  duration,
  mulerunSessionId,
  isMulerun,
  agentId,
}: CreateTextToImageParams) => {
  try {
    const requestBody: any = {
      prompt,
      model,
      apiKey,
      image,
      mulerunSessionId,
      isMulerun,
      agentId,
    };

    if (duration) {
      requestBody.duration = duration;
    }

    const res = await ky.post<CreateTextToImageResult>("/api/image-to-video", {
      timeout: 300000,
      json: requestBody,
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

export const pollVideoStatus = async ({
  apiKey,
  taskId,
}: {
  apiKey: string;
  taskId: string;
}) => {
  try {
    const res = await ky.post<PollVideoResult>("/api/video-poll", {
      timeout: 300000,
      json: {
        apiKey,
        taskId,
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
