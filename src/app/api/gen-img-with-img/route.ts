import { createScopedLogger, generateFluxKontextImage } from "@/utils";
import { env } from "@/env";
import ky from "ky";
import { APICallError } from "ai";
import { ErrorToast } from "@/components/ui/errorToast";
import { generateSeedEditImage } from "@/utils/seed-image";
import { generateSeedEditV3Image } from "@/utils/seed-image-3.0";
const logger = createScopedLogger("gen-img-with-img");
// 计算 Gemini 2.5 Flash 模型的成本
function calculateGeminiCost(usageMetadata: {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
  promptTokensDetails?: Array<{
    modality: string;
    tokenCount: number;
  }>;
  candidatesTokensDetails?: Array<{
    modality: string;
    tokenCount: number;
  }>;
}) {
  const inputCostPerToken = 1 / 1_000_000; // $1 / 1M Tokens
  const outputCostPerToken = 30 / 1_000_000; // $30 / 1M Tokens

  const inputCost = usageMetadata.promptTokenCount * inputCostPerToken;
  const outputCost = usageMetadata.candidatesTokenCount * outputCostPerToken;

  const totalCost = inputCost + outputCost;
  return totalCost; // 直接返回 PTC 值
}

// GPT-4o 专用价格
function calculateGPT4oCost(usage: {
  input_tokens?: number;
  output_tokens?: number;
  input_tokens_details?: {
    text_tokens?: number;
    image_tokens?: number;
  };
}) {
  const TEXT_IN = 5 / 1_000_000; // 5  PTC / 1M
  const IMAGE_IN = 10 / 1_000_000; // 10 PTC / 1M
  const IMAGE_OUT = 40 / 1_000_000; // 40 PTC / 1M

  // 缺省时回退到总 tokens
  const textIn = usage.input_tokens_details?.text_tokens ?? 0;
  const imageIn = usage.input_tokens_details?.image_tokens ?? 0;
  const imageOut = usage.output_tokens ?? 0;

  return textIn * TEXT_IN + imageIn * IMAGE_IN + imageOut * IMAGE_OUT;
}

// Helper function to convert URL to File object
const urlToFile = async (url: string, filename: string): Promise<File> => {
  // Fetch the image
  const response = await fetch(url);
  const blob = await response.blob();

  // Create File object from blob
  return new File([blob], filename, { type: blob.type });
};

// Helper function to convert image URL to base64 (Node.js compatible)
const urlToBase64 = async (url: string): Promise<string> => {
  // 使用fetch获取图片数据
  console.log("url", "url", url);

  const response = await fetch(url);
  console.log("response", "response", response);

  const arrayBuffer = await response.arrayBuffer();

  // 将arrayBuffer转换为base64字符串
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  // 根据URL判断图片类型
  const contentType = response.headers.get("content-type") || "image/png";

  // 返回完整的data URL
  return `data:${contentType};base64,${base64}`;
};

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
  apiKey: string,
  sourceLang: "ZH" | "EN"
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
          source_lang: "ZH",
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

// 处理base64图像数据
const getCleanBase64 = (img: string): string => {
  // 如果是数据URL（以data:开头），提取出base64部分
  if (img.startsWith("data:")) {
    return img.split(",")[1];
  }
  return img;
};

// // Helper function to determine image orientation using Sharp
// const getImageOrientation = async (file: File): Promise<string> => {
//   try {
//     // Convert File to Buffer
//     const arrayBuffer = await file.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);

//     // Get image metadata using Sharp
//     const metadata = await sharp(buffer).metadata();

//     if (!metadata.width || !metadata.height) {
//       logger.warn("Could not determine image dimensions, using default size");
//       return "1024x1024"; // Default to square if dimensions unavailable
//     }

//     if (metadata.width > metadata.height) {
//       return "1536x1024"; // Landscape
//     } else if (metadata.height > metadata.width) {
//       return "1024x1536"; // Portrait
//     } else {
//       return "1024x1024"; // Square
//     }
//   } catch (error) {
//     logger.error("Error in Sharp image processing:", error);
//     return "1024x1024"; // Default to square on error
//   }
// };

export async function POST(request: Request) {
  try {
    const {
      apiKey,
      img,
      prompt,
      size = "1024x1024",
      model = "gpt-image-1",
      sourceLang = "ZH",
      mulerunSessionId,
      isMulerun,
      agentId,
      isOptimize = false,
      customOptimizePrompt,
    }: {
      img: string;
      prompt: string;
      apiKey: string;
      size: "1024x1024" | "1536x1024" | "1024x1536";
      model?:
        | "gpt-image-1"
        | "flux-kontext-pro"
        | "flux-kontext-max"
        | "SeedEdit 3.0"
        | "gemini-2.5-flash-image-preview"
        | "doubao-seedream-4-0-250828";
      sourceLang?: "ZH" | "EN";
      mulerunSessionId?: string;
      isMulerun?: boolean;
      agentId?: string;
      isOptimize?: boolean;
      customOptimizePrompt?: string;
    } = await request.json();

    // Add optimization logic
    let optimizedPrompt = prompt;
    if (isOptimize && customOptimizePrompt) {
      try {
        const { createAI302 } = await import("@302ai/ai-sdk");
        const { generateText } = await import("ai");
        const prompts = await import("@/constants/prompts");

        const ai302 = createAI302({
          apiKey,
          baseURL: env.NEXT_PUBLIC_API_URL,
        });

        const optimizePromptTemplate =
          prompts.default.getOptimizePrompt(customOptimizePrompt);

        const { text } = await generateText({
          model: ai302.chatModel("gpt-4.1"),
          system: customOptimizePrompt,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        optimizedPrompt = text;
        logger.info("Prompt optimized", {
          original: prompt,
          optimized: optimizedPrompt,
        });
      } catch (error) {
        logger.error("Failed to optimize prompt", error);
        // Continue with original prompt if optimization fails
      }
    }

    if (model === "gemini-2.5-flash-image-preview") {
      try {
        const res = await ky.post(
          `${env.NEXT_PUBLIC_API_URL}/302/image/generate`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            timeout: false,
            json: {
              prompt: optimizedPrompt,
              model: "gemini-2.5-flash-image",
              image: img,
              // ...(image !== "" ? { image } : {}),
            },
          }
        );
        const { image_url, data } = await res.json<any>();
        const { usageMetadata } = data;

        // 将返回的URL转换为base64
        const base64Image = await urlToBase64(image_url);
        const cleanBase64 = getCleanBase64(base64Image);

        if (isMulerun && mulerunSessionId && agentId) {
          const cost = calculateGeminiCost(usageMetadata);
          const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL! || "http://localhost:3000";

          await ky.post(`${baseUrl}/api/verify-mulerun`, {
            json: {
              agentId,
              sessionId: mulerunSessionId,
              cost,
              isFinal: false,
            },
            headers: { "Content-Type": "application/json" },
          });
        }

        return Response.json({
          image: {
            b64_json: cleanBase64,
            url: "",
          },
        });
      } catch (error) {
        logger.error("SeedEdit v3.0 generation failed", error);
        return Response.json({ error: "图像编辑失败" }, { status: 500 });
      }
    }

    if (model === "SeedEdit 3.0") {
      try {
        // 处理输入图像，确保它是base64格式
        // let imageBase64 = img;
        // if (img.startsWith("http")) {
        //   // 如果是URL，转换为base64
        //   imageBase64 = await urlToBase64(img);
        // }

        // 获取干净的base64数据（去掉前缀）
        // const cleanBase64 = getCleanBase64(imageBase64);

        // 使用SeedEdit进行图像编辑
        const url = await generateSeedEditV3Image(
          env.NEXT_PUBLIC_API_URL,
          optimizedPrompt,
          apiKey,
          img
        );

        // 将返回的URL转换为base64
        const base64Image = await urlToBase64(url);

        return Response.json({
          image: {
            b64_json: base64Image,
            url: "",
          },
        });
      } catch (error) {
        logger.error("SeedEdit v3.0 generation failed", error);
        return Response.json({ error: "图像编辑失败" }, { status: 500 });
      }
    }

    if (
      model.toLowerCase() === "flux-kontext-pro" ||
      model.toLowerCase() === "flux-kontext-max"
    ) {
      try {
        // 处理输入图像，确保它是base64格式
        let imageBase64 = img;
        if (img.startsWith("http")) {
          // 如果是URL，转换为base64
          imageBase64 = await urlToBase64(img);
        }

        // 获取干净的base64数据（去掉前缀）
        const cleanBase64 = getCleanBase64(imageBase64);

        // 对于Flux Kontext Pro模型，我们需要先翻译提示词，然后使用不同的API
        const englishPrompt = await translateToEnglish(
          optimizedPrompt,
          apiKey,
          sourceLang
        );
        logger.info("Translated prompt for Flux-Kontext-Pro", {
          original: prompt,
          translated: englishPrompt,
        });

        // 生成图像，传入输入图像
        const base64Image = await generateFluxKontextImage(
          env.NEXT_PUBLIC_API_URL,
          englishPrompt,
          apiKey,
          cleanBase64,
          model as "flux-kontext-pro" | "flux-kontext-max",
          mulerunSessionId,
          isMulerun,
          agentId
        );

        return Response.json({
          image: {
            b64_json: base64Image,
            url: "", // Flux Kontext Pro不会返回URL，只返回base64数据
          },
        });
      } catch (error) {
        logger.error("Error with Flux-Kontext-Pro model:", error);
        throw error;
      }
    }

    if (model === "doubao-seedream-4-0-250828") {
      try {
        const res = await ky.post(
          `${env.NEXT_PUBLIC_API_URL}/302/image/generate`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            timeout: false,
            json: {
              prompt: optimizedPrompt,
              model: "doubao-seedream-4-0-250828",
              image: img,
              // size: "4k",
            },
          }
        );
        const { image_url } = await res.json<any>();

        // 将返回的URL转换为base64
        const base64Image = await urlToBase64(image_url);
        const cleanBase64 = getCleanBase64(base64Image);

        if (isMulerun && mulerunSessionId && agentId) {
          const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL! || "http://localhost:3000";

          await ky.post(`${baseUrl}/api/verify-mulerun`, {
            json: {
              agentId,
              sessionId: mulerunSessionId,
              cost: 0.03,
              isFinal: false,
            },
            headers: { "Content-Type": "application/json" },
          });
        }

        return Response.json({
          image: {
            b64_json: cleanBase64,
            url: "",
          },
        });
      } catch (error) {
        logger.error("SeedEdit v3.0 generation failed", error);
        return Response.json({ error: "图像编辑失败" }, { status: 500 });
      }
    }

    // 以下是原有的GPT-4o处理流程
    // Create FormData
    const formdata = new FormData();

    try {
      // Create an array to hold both images
      const imageFiles = [];
      let originalImageFile;

      // Convert origin image URL to File object
      if (img && img.startsWith("http")) {
        const filename = img.split("/").pop() || "image1.jpg";
        const imageFile = await urlToFile(img, filename);
        originalImageFile = imageFile;
        imageFiles.push(imageFile);
      } else {
        // Handle case where originImage is already a File or base64
        originalImageFile = img;
        imageFiles.push(img);
      }

      // Append both images to the FormData
      for (let i = 0; i < imageFiles.length; i++) {
        formdata.append("image", imageFiles[i]);
      }

      // Determine image size based on orientation of the first image (original)
      const imageSize = "1024x1024"; // Default size
      // if (originalImageFile instanceof File) {
      //   try {
      //     imageSize = await getImageOrientation(originalImageFile);
      //   } catch (error) {
      //     logger.error("Error determining image orientation:", error);
      //     // Fall back to default size
      //   }
      // }

      // Create a prompt that tells the API to modify the first image based on the second image's style

      formdata.append("prompt", prompt);

      // Add other required parameters
      formdata.append("model", model);
      formdata.append("quality", "auto");
      formdata.append("size", size || imageSize);

      // Call the API
      const result = await ky
        .post("https://api.302.ai/v1/images/edits", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          retry: {
            limit: 1,
            methods: [
              "post",
              "get",
              "put",
              "head",
              "delete",
              "options",
              "trace",
            ], // 明确包含 'post'
          },
          body: formdata,
          timeout: 120000,
        })
        .text();

      logger.info("API response received", {
        result: result.substring(0, 200) + "...",
      });

      // Parse the response to get the image URL
      let responseData;
      try {
        responseData = JSON.parse(result);
        console.log(responseData);

        if (isMulerun && mulerunSessionId && agentId && responseData.usage) {
          const cost = calculateGPT4oCost(responseData.usage);
          const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

          await ky.post(`${baseUrl}/api/verify-mulerun`, {
            json: {
              agentId,
              sessionId: mulerunSessionId,
              cost,
              isFinal: false,
            },
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch (parseError) {
        logger.error("Failed to parse API response as JSON", {
          result: result.substring(0, 500),
          parseError,
        });
        throw new Error(
          `Invalid JSON response from API: ${result.substring(0, 200)}`
        );
      }
      const image = responseData?.data?.[0];

      if (!image) {
        logger.error("Image URL not found in response", responseData);
        return Response.json(
          {
            error: "Image URL not found in response",
          },
          { status: 500 }
        );
      }

      return Response.json({
        image,
      });
    } catch (apiError: any) {
      logger.error("API call failed:", apiError);

      // Check if error has response with error code for ErrorToast
      if (apiError.response) {
        try {
          const errorText = await apiError.response.text();
          const errorData = JSON.parse(errorText);
          if (errorData.error && errorData.error.err_code) {
            // If we have a structured error with err_code, return it directly
            return Response.json(errorData, {
              status: apiError.response.status || 500,
            });
          }
        } catch (parseError) {
          // If parsing fails, continue to default error handling
        }
      }

      throw apiError;
    }
  } catch (error: any) {
    logger.error("Error in gen-style-reference-image:", error);

    if (error instanceof APICallError) {
      const resp = error.responseBody;
      return Response.json(resp, { status: 500 });
    }

    // Handle different types of errors
    const errorMessage = "Failed to generate image";
    const errorCode = 500;

    if (error instanceof Error) {
      console.log("error", error);

      const resp = (error as any)?.responseBody as any;
      if (resp) {
        return Response.json(resp, { status: 500 });
      }
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
