import ky from "ky";
import { createScopedLogger } from "./logger";
import { env } from "@/env";

const logger = createScopedLogger("gpt-image-1");

export function calculateCost(usage: {
  input_tokens: number;
  output_tokens: number;
}) {
  const inputCostPerToken = 5 / 1_000_000; // 5 PTC / 1M Tokens
  const outputCostPerToken = 40 / 1_000_000; // 40 PTC / 1M Tokens
  const inputCost = usage.input_tokens * inputCostPerToken;
  const outputCost = usage.output_tokens * outputCostPerToken;

  const totalCost = inputCost + outputCost;
  return totalCost; // 直接返回 PTC 值，移除 Math.round(totalCost * 10_000)
}

// 定义302接口响应接口
interface GPTImageResponse {
  data: Array<{
    url: string;
  }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

/**
 * 使用GPT-Image-1模型生成图像
 * @param apiUrl API基础URL
 * @param prompt 提示词
 * @param apiKey API密钥
 * @param size 图像尺寸
 * @param mulerunSessionId MuleRun会话ID
 * @param isMulerun 是否为MuleRun场景
 * @param agentId Agent ID
 * @returns 返回base64格式的图像数据
 */
export async function generateGPTImage(
  apiUrl: string,
  prompt: string,
  apiKey: string,
  size: string = "1024x1024",
  mulerunSessionId?: string,
  isMulerun?: boolean,
  agentId?: string
): Promise<string> {
  logger.info(`使用GPT-Image-1模型生成图像`);

  // // 只在 MuleRun 场景扣费
  // if (isMulerun && mulerunSessionId) {
  //   logger.info("MuleRun 场景扣费");
  //   logger.info("agentId", agentId);
  //   logger.info("mulerunSessionId", mulerunSessionId);

  //   //  文字输入 5 PTC/1M Tokens
  //   // 图片输出 40 PTC/1M Tokens
  //   const cost = 0; // GPT-Image-1 固定费用

  //   // 调用扣费路由
  //   const baseUrl = env.NEXT_PUBLIC_BASE_URL;
  //   const reportRes = await ky.post(`${baseUrl}/api/verify-mulerun`, {
  //     json: {
  //       agentId: agentId,
  //       sessionId: mulerunSessionId,
  //       cost,
  //       isFinal: false,
  //     },
  //     headers: { "Content-Type": "application/json" },
  //   });

  //   if (!reportRes.ok) {
  //     logger.error("Metering 上报失败", await reportRes.text());
  //   } else {
  //     logger.info(`Metering 上报成功：${cost} cost`);
  //   }
  // }

  // 调用302 API生成图像
  const response = await ky.post(`${apiUrl}/v1/images/generations`, {
    json: {
      prompt,
      model: "gpt-image-1",
      size,
    },
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: false, // 减少超时时间到5分钟
    retry: {
      limit: 2,
      methods: ["post"],
    },
  });

  const data = (await response.json()) as GPTImageResponse;

  // 打印usage信息
  // 只在 MuleRun 场景扣费
  if (isMulerun && mulerunSessionId && data.usage) {
    // 计算成本
    const cost = calculateCost(data.usage);

    // 调用扣费路由
    // const baseUrl = env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const baseUrl = "http://localhost:3000";
    const reportRes = await ky.post(`${baseUrl}/api/verify-mulerun`, {
      json: {
        agentId: agentId,
        sessionId: mulerunSessionId,
        cost: cost, // 转换为 cost 单位
        isFinal: false,
      },
      headers: { "Content-Type": "application/json" },
      timeout: false,
    });

    if (!reportRes.ok) {
      logger.error("Metering 上报失败", await reportRes.text());
    } else {
      logger.info(`Metering 上报成功：${cost * 10000} cost`);
    }
  }

  // 获取图像URL并转换为base64
  if (data.data && data.data[0]?.url) {
    const imageUrl = data.data[0].url;
    try {
      // 获取图片内容
      const imageResponse = await fetch(imageUrl);
      const arrayBuffer = await imageResponse.arrayBuffer();

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
