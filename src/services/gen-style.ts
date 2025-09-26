import ky, { HTTPError } from "ky";
import { emitter } from "@/utils/mitt";
import { store, languageAtom } from "@/stores";
import { langToCountry } from "@/utils/302";

interface GenerateImageParams {
  apiKey: string;
  originImage?: string;
  referenceImage?: string;
  prompt?: string;
  model?: "gpt-image-1" | "Flux-Kontext-Pro";
}

interface GenerateImageResult {
  image: {
    b64_json: string;
    url: string;
  };
}

// 定义API错误接口
interface ApiError {
  err_code: number;
  message: string;
  message_cn?: string;
  message_jp?: string;
  type: string;
}

export const generateStyleImage = async ({
  apiKey,
  originImage,
  referenceImage,
  model = "gpt-image-1",
}: GenerateImageParams) => {
  try {
    const res = await ky.post("/api/gen-style-reference-image", {
      timeout: 300000,
      // retry: {
      //   limit: 1,
      //   methods: ["post", "get", "put", "head", "delete", "options", "trace"], // 明确包含 'post'
      // },
      json: {
        originImage,
        referenceImage,
        apiKey,
        model,
      },
    });
    return res.json<GenerateImageResult>();
  } catch (error) {
    if (error instanceof Error) {
      const uiLanguage = store.get(languageAtom);

      if (error instanceof HTTPError) {
        try {
          // 尝试获取错误响应体
          const errorResponse = await error.response.json();

          // 处理直接返回的错误对象
          if (errorResponse.error) {
            const errorData = errorResponse;
            if (uiLanguage) {
              const countryCode = langToCountry(uiLanguage);
              const messageKey =
                countryCode === "en" ? "message" : `message_${countryCode}`;
              // 如果这个特定语言的消息不存在，回退到英文
              const message =
                errorData.error[messageKey] || errorData.error.message;
              emitter.emit("ToastError", {
                code: errorData.error.err_code,
                message,
              });
            }
          }
          // 处理可能已经是标准错误格式的情况
          else if (errorResponse.err_code !== undefined) {
            if (uiLanguage) {
              const countryCode = langToCountry(uiLanguage);
              const messageKey =
                countryCode === "en" ? "message" : `message_${countryCode}`;
              // 如果这个特定语言的消息不存在，回退到英文
              const message =
                errorResponse[messageKey] || errorResponse.message;
              emitter.emit("ToastError", {
                code: errorResponse.err_code,
                message,
              });
            }
          }
          // 未知错误格式
          else {
            emitter.emit("ToastError", {
              code: error.response.status,
              message: JSON.stringify(errorResponse),
            });
          }

          // 构造并抛出错误对象，包含完整错误信息
          const enhancedError = new Error(
            errorResponse.error?.message ||
              errorResponse.message ||
              error.message
          );
          (enhancedError as any).apiError =
            errorResponse.error || errorResponse;
          throw enhancedError;
        } catch (parseError) {
          // 如果解析响应失败，尝试获取响应文本
          try {
            const errorText = await error.response.text();
            emitter.emit("ToastError", {
              code: error.response.status,
              message: errorText || error.message,
            });

            // 抛出带原始响应文本的错误
            const textError = new Error(errorText || error.message);
            (textError as any).responseText = errorText;
            throw textError;
          } catch {
            // 如果连文本都无法获取
            // emitter.emit("ToastError", {
            //   code: error.response.status,
            //   message: error.message,
            // });
            throw error;
          }
        }
      } else {
        // 对于非HTTP错误
        emitter.emit("ToastError", {
          code: 500,
          message: error.message,
        });
        throw error;
      }
    } else {
      // 处理非Error类型的错误
      emitter.emit("ToastError", {
        code: 500,
        message: String(error),
      });
      throw error;
    }
  }
};
