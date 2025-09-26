import ky from "ky";
import { createScopedLogger } from "./logger";
import { generateSeedEditImage } from "./seed-image";

const logger = createScopedLogger("seed-edit");

// 定义SeedEdit v3.0接口
interface SeedEditResponseData {
  code: number;
  data: {
    task_id: string;
  };
  message: string;
  request_id: string;
  status: number;
  time_elapsed: string;
}

interface SeedEditResultData {
  code: number;
  data: {
    algorithm_base_resp: {
      status_code: number;
      status_message: string;
    };
    binary_data_base64: string[];
    image_urls: string[];
    resp_data: string;
    comfyui_cost: string;
    image_output: any;
    log_output: string;
    status: string;
  };
  message: string;
  request_id: string;
  status: number;
  time_elapsed: string;
}

/**
 * 使用SeedEdit v3.0模型进行图像编辑
 * @param apiUrl API基础URL
 * @param prompt 编辑指令
 * @param apiKey API密钥
 * @param imageBase64 输入图像（base64格式）
 * @param scale 编辑强度 (0-1)
 * @param seed 随机种子
 * @returns 返回base64格式的图像数据
 */
export async function generateSeedEditV3Image(
  apiUrl: string,
  prompt: string,
  apiKey: string,
  imageUrl: string,
  scale: number = 0.5,
  seed: number = -1
): Promise<string> {
  // 发送图像编辑请求
  logger.info(`使用SeedEdit v3.0进行图像编辑`);

  // 准备请求体
  const requestBody = {
    image: imageUrl,
    prompt,
    seed,
    model: "doubao-seededit-3-0-i2i-250628",
    watermark: false,
  };

  logger.info("发送SeedEdit编辑请求", requestBody);

  const response = await ky.post(`${apiUrl}/doubao/images/generations`, {
    json: requestBody,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    timeout: 600000,
  });

  const imageData: any = (await response.json()) as SeedEditResponseData;
  if (imageData.data.length === 0) {
    throw new Error(`SeedEdit请求失败`);
  }

  // 返回base64图像数据
  if (
    imageData.data.binary_data_base64 &&
    imageData.data.binary_data_base64.length > 0
  ) {
    return imageData.data.binary_data_base64[0];
  } else if (imageData.data && imageData.data.length > 0) {
    // 如果返回的是URL，转换为base64
    const imageUrl = imageData.data[0].url;
    console.log("image", imageUrl);

    return imageUrl;
  } else {
    throw new Error("没有获取到有效的图片数据");
  }
}

/**
 * 轮询获取SeedEdit v3.0编辑结果
 * @param apiUrl API基础URL
 * @param taskId 任务ID
 * @param apiKey API密钥
 * @param maxAttempts 最大轮询次数
 * @returns 图像数据
 */
async function pollForSeedEditResult(
  apiUrl: string,
  taskId: string,
  apiKey: string,
  maxAttempts = 60
): Promise<SeedEditResultData> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const pollResponse = await ky.post(
      `${apiUrl}/doubao/drawing/seededit_v30_result`,
      {
        json: {
          task_id: taskId,
        },
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 120000,
      }
    );

    const resultData = (await pollResponse.json()) as SeedEditResultData;
    logger.info(`轮询尝试 ${attempts + 1}`, {
      status: resultData.data.status,
      taskId: taskId,
    });

    if (
      resultData &&
      resultData.code === 10000 &&
      resultData.data.status === "done"
    ) {
      logger.info("获取到完成的图像编辑结果", {
        taskId: taskId,
      });
      return resultData;
    }

    // 如果任务失败，抛出错误
    if (resultData.data.status === "failed") {
      throw new Error("图像编辑任务失败");
    }

    // 等待2秒后重试
    await new Promise((resolve) => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error("图像编辑超时，请重试");
}

/**
 * 向后兼容的函数，将Flux-Kontext调用重定向到SeedEdit
 * @param apiUrl API基础URL
 * @param prompt 提示词
 * @param apiKey API密钥
 * @param imageBase64 可选的输入图像（base64格式）
 * @param model 模型名称（为了兼容性保留，但实际使用SeedEdit）
 * @returns 返回base64格式的图像数据
 */
export async function generateFluxKontextImage(
  apiUrl: string,
  prompt: string,
  apiKey: string,
  imageBase64?: string,
  model?:
    | "flux-kontext-pro"
    | "flux-kontext-max"
    | "gpt-image-1"
    | "seededit_v30"
): Promise<string> {
  if (!imageBase64) {
    throw new Error("SeedEdit需要输入图像");
  }

  logger.info(`兼容性调用：将${model}重定向到SeedEdit v3.0`);

  // 调用新的SeedEdit函数
  return generateSeedEditImage(apiUrl, prompt, apiKey, imageBase64);
}
