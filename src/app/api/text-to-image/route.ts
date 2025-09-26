import {
  APICallError,
  experimental_generateImage as generateImage,
  generateText,
} from "ai";
import { createAI302 } from "@302ai/ai-sdk";
import { createScopedLogger } from "@/utils";
import { env } from "@/env";
import ky from "ky";
import prompts from "@/constants/prompts";

const logger = createScopedLogger("gen-image");

export async function POST(request: Request) {
  try {
    const {
      prompt,
      apiKey,
      actionImage,
    }: {
      prompt: string;
      apiKey: string;
      actionImage: string;
    } = await request.json();
    const ai302 = createAI302({
      apiKey,
      baseURL: env.NEXT_PUBLIC_API_URL,
    });

    const { image }: any = await generateImage({
      model: ai302.image("gpt-image-1-edit"),
      prompt: "",
    });

    logger.info("Image generated successfully");

    // Upload the generated base64 image to the server
    try {
      // Convert base64 to blob
      const base64Response = await fetch(
        `data:image/png;base64,${image.base64 || image.base64Data}`
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
            image: image.base64Data,
            imageUrl: uploadResponse.data.url,
            prompt,
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
          image: image.base64,
          prompt,
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
