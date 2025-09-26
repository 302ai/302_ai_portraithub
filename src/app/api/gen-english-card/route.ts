import {
  APICallError,
  experimental_generateImage as generateImage,
  generateText,
} from "ai";
import { createAI302 } from "@302ai/ai-sdk";
import { createScopedLogger, generateFluxKontextImage } from "@/utils";
import { env } from "@/env";
import ky from "ky";
import prompts from "@/constants/prompts";
import { generateGPTImage } from "@/utils/gpt-image-1";
import { generateGemini25FlashImage } from "@/utils/gemini-2.5-flash-image";

const logger = createScopedLogger("gen-english-card");

interface DeepLTranslation {
  detected_source_language?: string;
  text: string;
}

interface DeepLResponse {
  translations: DeepLTranslation[];
}

// 翻译函数
async function translateToEnglish(
  text: string,
  apiKey: string
): Promise<string> {
  try {
    const response = await ky.post(
      `${env.NEXT_PUBLIC_API_URL}/deepl/v2/translate`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        json: {
          text: [text],
          target_lang: "EN",
        },
      }
    );

    const result = (await response.json()) as DeepLResponse;
    logger.info("translation-success", { result });

    if (result.translations && result.translations.length > 0) {
      return result.translations[0].text;
    } else {
      throw new Error("No translations found in response");
    }
  } catch (error) {
    logger.error("Failed to translate text", error);
    // 如果翻译失败，返回原文
    return text;
  }
}

export async function POST(request: Request) {
  try {
    const {
      words,
      apiKey,
      model = "gpt-image-1",
      mulerunSessionId,
      isMulerun,
      agentId,
    }: {
      words: string;
      apiKey: string;
      model?: "gpt-image-1" | "flux-kontext-pro" | "flux-kontext-max";
      mulerunSessionId?: string;
      isMulerun?: boolean;
      agentId?: string;
    } = await request.json();
    const ai302 = createAI302({
      apiKey,
      baseURL: env.NEXT_PUBLIC_API_URL,
    });

    const prompt = `Translate the words entered by the user into English and create word cards with both text and images. The generated quality can be used for course educational materials. The background color of the card is cream.
    ${words}
    `;

    let newImage: any;

    if (model === "flux-kontext-pro" || model === "flux-kontext-max") {
      // 翻译提示词为英文
      const englishPrompt = await translateToEnglish(prompt, apiKey);
      logger.info("Translated prompt for Flux-Kontext-Pro", {
        original: prompt,
        translated: englishPrompt,
      });

      // 使用Flux Kontext Pro模型生成图像
      const base64Image = await generateFluxKontextImage(
        env.NEXT_PUBLIC_API_URL,
        englishPrompt,
        apiKey,
        undefined,
        model,
        mulerunSessionId,
        isMulerun,
        agentId
      );

      newImage = {
        base64Data: base64Image,
      };
    } else if (model === "gpt-image-1") {
      // 使用自定义的GPT-Image-1实现
      const base64Image = await generateGPTImage(
        env.NEXT_PUBLIC_API_URL,
        `${prompt},结果只输出图片url，不要输出文字！`,
        apiKey,
        "1024x1024",
        mulerunSessionId,
        isMulerun,
        agentId
      );

      newImage = {
        base64Data: base64Image,
      };
    } else if (
      model === "gemini-2.5-flash-image" ||
      model === "gemini-2.5-flash-image-preview"
    ) {
      // 使用自定义的GPT-Image-1实现
      const base64Image = await generateGemini25FlashImage(
        env.NEXT_PUBLIC_API_URL,
        `${prompt},结果只输出图片url，不要输出文字！`,
        apiKey,
        "1024x1024",
        mulerunSessionId,
        isMulerun,
        agentId
      );

      newImage = {
        base64Data: base64Image,
      };
    } else {
      // 使用默认的GPT-4o模型生成图像
      console.log("model是", model);

      const { image }: any = await generateImage({
        model: ai302.image(model),
        providerOptions: {
          google: { responseModalities: ["IMAGE"] },
        },
        prompt: `${prompt},结果只输出图片url，不要输出文字！`,
      });

      newImage = image;
    }

    logger.info("Image generated successfully");

    // Upload the generated base64 image to the server
    try {
      // Convert base64 to blob
      const base64Response = await fetch(
        `data:image/png;base64,${newImage.base64 || newImage.base64Data}`
      );
      const blob = await base64Response.blob();

      // Create FormData and append the image
      const formData = new FormData();
      formData.append("file", blob, "generated-image.png");

      // Upload the image
      const uploadResponse = await ky
        .post(`${env.NEXT_PUBLIC_AUTH_API_URL}/gpt/api/upload/gpt/image`, {
          body: formData,
        })
        .json<{
          code: number;
          msg: string;
          data: {
            url: string;
          };
        }>();
      if (uploadResponse.code === 0) {
        logger.info("Image uploaded successfully");

        return Response.json({
          image: {
            image: newImage.base64Data || newImage.base64,
            imageUrl: uploadResponse.data.url,
            prompt: words,
            model: model,
          },
        });
      } else {
        logger.error(`Upload failed: ${uploadResponse.msg}`);
        throw new Error(`Image upload failed: ${uploadResponse.msg}`);
      }
    } catch (uploadError) {
      logger.error("Error uploading generated image:", uploadError);
      // If upload fails, still return the base64 image
      return Response.json({
        image: {
          image: newImage.base64 || newImage.base64Data,
          prompt: words,
          model: model,
          uploadError: "Failed to upload the image to server",
        },
      });
    }
  } catch (error) {
    // logger.error(error);
    if (error instanceof APICallError) {
      // console.log("APICallError", error);

      const resp = error.responseBody;

      return Response.json(resp, { status: 500 });
    }
    // Handle different types of errors
    const errorMessage = "Failed to generate image";
    const errorCode = 500;

    if (error instanceof Error) {
      console.log("error", error);

      const resp = (error as any)?.responseBody as any; // You can add specific error code mapping here if needed
      return Response.json(resp, { status: 500 });
    }

    return Response.json(
      {
        error: {
          err_code: errorCode,
          message: errorMessage,
          message_cn: "生成图片失败",
          message_en: "Failed to generate image",
          message_ja: "画像の生成に失敗しました",
          type: "IMAGE_GENERATION_ERROR",
        },
      },
      { status: errorCode }
    );
  }
}
