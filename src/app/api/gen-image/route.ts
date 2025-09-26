import {
  APICallError,
  experimental_generateImage as generateImage,
  generateText,
} from "ai";
import { generateGPTImage } from "@/utils/gpt-image-1";
import { createAI302 } from "@302ai/ai-sdk";
import { createScopedLogger, generateFluxKontextImage } from "@/utils";
import { env } from "@/env";
import ky from "ky";
import prompts from "@/constants/prompts";
import { generateGemini25FlashImage } from "@/utils/gemini-2.5-flash-image";
import { generateSeedreamImage } from "@/utils/doubao-seedream";

const logger = createScopedLogger("gen-image");

function calculateOptimizeCost(usage: {
  promptTokens: number;
  completionTokens: number;
}) {
  const inputCostPerToken = 3 / 1_000_000; // 输入：3 PTC / 1M Tokens
  const outputCostPerToken = 15 / 1_000_000; // 输出：15 PTC / 1M Tokens

  const inputCost = usage.promptTokens * inputCostPerToken;
  const outputCost = usage.completionTokens * outputCostPerToken;

  const totalCost = inputCost + outputCost;

  return totalCost;
}

export async function POST(request: Request) {
  try {
    const {
      prompt,
      apiKey,
      isOptimize,
      model,
      mulerunSessionId,
      isMulerun,
      agentId,
    }: {
      prompt: string;
      apiKey: string;
      isOptimize: boolean;
      model: "gpt-image-1" | "flux-kontext-pro" | "flux-kontext-max";
      mulerunSessionId?: string;
      isMulerun?: boolean;
      agentId?: string;
    } = await request.json();
    const ai302 = createAI302({
      apiKey,
      baseURL: env.NEXT_PUBLIC_API_URL,
    });

    let newPrompt = prompt;

    // if (isOptimize) {
    //   // 输入:
    //   // $3/1M tokens
    //   //  输出:
    //   // $15/1M tokens
    //   const { text, usage } = await generateText({
    //     model: ai302.chatModel("claude-3-7-sonnet-20250219"),
    //     prompt: prompts.optimizeImage.compile({ input: prompt }),
    //   });
    //   newPrompt = text;
    //   console.log("usage", usage);
    //   // usage { promptTokens: 261, completionTokens: 84, totalTokens: 345 }
    // }

    if (isOptimize) {
      // 1. 先调用优化文本（Claude-3.7-Sonnet）
      const { text, usage } = await generateText({
        model: ai302.chatModel("claude-3-7-sonnet-20250219"),
        prompt: prompts.optimizeImage.compile({ input: prompt }),
      });
      newPrompt = text;
      logger.info("usage:", usage);

      // 2. **MuleRun 场景：先扣优化费**
      if (mulerunSessionId && agentId) {
        const optCost = calculateOptimizeCost(usage);
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        await ky.post(`${baseUrl}/api/verify-mulerun`, {
          json: {
            agentId,
            sessionId: mulerunSessionId,
            cost: optCost,
            isFinal: false,
          },
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    let newImage: any;
    if (model === "flux-kontext-pro" || model === "flux-kontext-max") {
      // 使用封装后的函数生成图像

      const base64Image = await generateFluxKontextImage(
        env.NEXT_PUBLIC_API_URL,
        newPrompt,
        apiKey,
        undefined,
        model as "flux-kontext-pro" | "flux-kontext-max",
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
        newPrompt,
        apiKey,
        "1024x1024",
        mulerunSessionId,
        isMulerun,
        agentId
      );

      newImage = {
        base64Data: base64Image,
      };
    } else if (model === "gemini-2.5-flash-image-preview") {
      // 使用自定义的GPT-Image-1实现
      const base64Image = await generateGemini25FlashImage(
        env.NEXT_PUBLIC_API_URL,
        newPrompt,
        apiKey,
        "1024x1024",
        mulerunSessionId,
        isMulerun,
        agentId
      );

      newImage = {
        base64Data: base64Image,
      };
    } else if (model === "doubao-seedream-4-0-250828") {
      // 使用自定义的GPT-Image-1实现
      const base64Image = await generateSeedreamImage(
        env.NEXT_PUBLIC_API_URL,
        newPrompt,
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
      const { image }: any = await generateImage({
        model: ai302.image(model),
        prompt: newPrompt,
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
            prompt: newPrompt,
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
          prompt: newPrompt,
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
