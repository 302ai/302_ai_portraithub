import ky from "ky";
import { createScopedLogger } from "./logger";

const logger = createScopedLogger("flux-kontext");

// 定义接口
interface FluxResponseData {
  id: string;
}

interface FluxImageData {
  id: string;
  status: string;
  result?: {
    seed: number;
    prompt: string;
    sample: string;
    duration: number;
    end_time: number;
    start_time: number;
  };
}

/**
 * 使用Flux-Kontext-Pro模型生成图像
 * @param apiUrl API基础URL
 * @param prompt 提示词
 * @param apiKey API密钥
 * @param imageBase64 可选的输入图像（base64格式）
 * @returns 返回base64格式的图像数据
 */
export async function generateFluxKontextImage(
  apiUrl: string,
  prompt: string,
  apiKey: string,
  imageBase64?: string,
  model?: "flux-kontext-pro" | "flux-kontext-max" | "gpt-image-1",
  mulerunSessionId?: string,
  isMulerun?: boolean,
  agentId?: string
): Promise<string> {
  // 发送图像生成请求
  logger.info(`使用模型: ${model}`);

  // 准备请求体
  const requestBody: any = {
    prompt,
    seed: 42,
    output_format: "png",
    prompt_upsampling: false,
    safety_tolerance: 2,
    mulerunSessionId,
    isMulerun,
    agentId,
  };

  // 如果提供了输入图像，则添加到请求体中
  if (imageBase64) {
    // 确保imageBase64不包含data:image/... 前缀
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    requestBody.input_image = cleanBase64;
    logger.info("使用输入图像进行生成");
  }
  // 只在 MuleRun 场景扣费
  if (isMulerun && mulerunSessionId) {
    logger.info("MuleRun 场景扣费");
    logger.info("agentId", agentId);
    logger.info("mulerunSessionId", mulerunSessionId);
    logger.info("model", model);
    const modelCost: Record<string, number> = {
      "flux-kontext-pro": 0.04, // 直接写 PTC 价格
      "flux-kontext-max": 0.08, // 直接写 PTC 价格
    };
    const cost = modelCost[model!] ?? 0;

    // 调用你已有的扣费路由（/api/verify-mulerun）
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const reportRes = await ky.post(`${baseUrl}/api/verify-mulerun`, {
      json: {
        agentId: agentId, // 测试 Agent
        sessionId: mulerunSessionId,
        cost,
        isFinal: false,
      },
      headers: { "Content-Type": "application/json" },
    });

    if (!reportRes.ok) {
      logger.error("Metering 上报失败", await reportRes.text());
      // 可选：抛错或仅记录，不影响图片返回
    } else {
      logger.info(`Metering 上报成功：${cost} cost`);
    }
  }
  const response = await ky.post(`${apiUrl}/flux/v1/${model}`, {
    json: requestBody,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    timeout: 600000,
  });

  const data = (await response.json()) as FluxResponseData;

  // 轮询获取结果
  const imageData = await pollForResult(apiUrl, data.id, apiKey);

  // 将URL图片转换为base64
  if (imageData.result?.sample) {
    const imageUrl = imageData.result.sample;
    try {
      // 获取图片内容
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();

      // 转换为base64
      return Buffer.from(arrayBuffer).toString("base64");
    } catch (error) {
      logger.error("转换URL到base64失败:", error);
      throw new Error("图片转换失败");
    }
  } else {
    throw new Error("没有获取到有效的图片URL");
  }
}

/**
 * 轮询获取Flux-Kontext-Pro生成结果
 * @param apiUrl API基础URL
 * @param id 任务ID
 * @param apiKey API密钥
 * @param maxAttempts 最大轮询次数
 * @returns 图像数据
 */
async function pollForResult(
  apiUrl: string,
  id: string,
  apiKey: string,
  maxAttempts = 60
): Promise<FluxImageData> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const pollResponse = await ky.get(`${apiUrl}/flux/v1/get_result?id=${id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 120000,
    });

    const imageData = (await pollResponse.json()) as FluxImageData;
    logger.info(`轮询尝试 ${attempts + 1}`);

    if (
      imageData &&
      imageData.status === "Ready" &&
      imageData.result &&
      imageData.result.sample
    ) {
      logger.info("获取到完成的图像结果");
      return imageData;
    }

    // 等待2秒后重试
    await new Promise((resolve) => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error("图像生成超时，请重试");
}
