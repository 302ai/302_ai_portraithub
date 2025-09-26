import { createScopedLogger } from "@/utils";
import ky from "ky";
import { env } from "@/env";

const logger = createScopedLogger("video-poll");

export async function POST(request: Request) {
  try {
    const {
      apiKey,
      taskId,
    }: {
      apiKey: string;
      taskId: string;
    } = await request.json();

    if (!taskId) {
      throw new Error("Task ID is required");
    }

    logger.info("Starting polling for task:", taskId);

    // 轮询获取结果
    let attempts = 0;
    let errorCount = 0;
    const maxAttempts = 60; // 最多轮询60次 (10分钟，每10秒一次)
    const maxErrorRetries = 3; // 最多错误重试3次
    const pollInterval = 10000; // 10秒间隔

    while (attempts < maxAttempts && errorCount < maxErrorRetries) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      attempts++;

      logger.info(
        `Polling attempt ${attempts}/${maxAttempts} for task ${taskId}`
      );

      try {
        const pollResponse = await ky.get(
          `${env.NEXT_PUBLIC_API_URL}/302/video/fetch/${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            timeout: false,
          }
        );

        const pollData: any = await pollResponse.json();
        logger.info("Poll response:", pollData);

        // 检查状态 - 根据实际的API响应结构
        if (pollData.status === "success" && pollData?.url) {
          logger.info("Video generation completed successfully");
          return Response.json(pollData);
        } else if (pollData.status === "fail" || pollData.status === "error") {
          logger.error("Video generation failed");
          throw new Error("Video generation failed");
        }

        // 如果状态是其他值，继续轮询
        logger.info(`Status: ${pollData.status}, continuing to poll...`);
        // 成功获取响应，重置错误计数器
        errorCount = 0;
      } catch (pollError) {
        errorCount++;
        logger.error(
          `Poll attempt ${attempts} failed (error ${errorCount}/${maxErrorRetries}):`,
          pollError
        );

        // 如果是HTTP错误，检查状态码
        if (pollError instanceof Error && (pollError as any).response) {
          const status = (pollError as any).response.status;

          // 对于某些错误状态码，应该立即停止轮询
          if (status === 404) {
            logger.error("Task not found, stopping polling");
            throw new Error("Task not found");
          } else if (status === 401 || status === 403) {
            logger.error(
              "Authentication/Authorization error, stopping polling"
            );
            throw new Error("Authentication error");
          } else if (status === 500) {
            logger.error("Server error, stopping polling");
            throw new Error("Server internal error");
          }
        }

        // 如果错误次数达到上限，停止轮询
        if (errorCount >= maxErrorRetries) {
          logger.error(
            `Max error retries (${maxErrorRetries}) reached, stopping polling`
          );
          throw new Error(
            `Polling failed after ${maxErrorRetries} consecutive errors`
          );
        }

        // 如果不是最后一次尝试，继续轮询
        if (attempts < maxAttempts) {
          logger.info(
            `Retrying after error... (${errorCount}/${maxErrorRetries} errors)`
          );
          continue;
        } else {
          throw pollError;
        }
      }
    }

    // 检查是因为错误重试上限还是轮询超时
    if (errorCount >= maxErrorRetries) {
      logger.error("Video polling stopped due to max error retries");
      throw new Error(
        `Video polling failed after ${maxErrorRetries} consecutive errors`
      );
    } else {
      logger.error("Video generation timed out after maximum attempts");
      throw new Error("Video generation timed out");
    }
  } catch (error) {
    logger.error("Video polling error:", error);

    // 处理一般错误
    const errorMessage =
      error instanceof Error ? error.message : "Failed to poll video status";
    const errorCode = 500;

    // 检查是否有响应体
    if (error instanceof Error) {
      const resp = (error as any)?.responseBody;
      if (resp) {
        return Response.json(resp, { status: 500 });
      }
    }

    // 返回标准化错误响应
    return Response.json(
      {
        error: {
          err_code: errorCode,
          message: errorMessage,
          message_cn: "轮询视频状态失败",
          message_en: "Failed to poll video status",
          message_ja: "動画ステータスのポーリングに失敗しました",
          type: "VIDEO_POLL_ERROR",
        },
      },
      { status: errorCode }
    );
  }
}
