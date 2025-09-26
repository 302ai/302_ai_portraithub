export type History = {
  id: string;
  rawPrompt: string;
  shouldOptimize: boolean;
  image: {
    base64: string;
    prompt: string;
    model: string;
    status: "pending" | "success" | "failed";
    size?: "1536x1024" | "1024x1024" | "1024x1536";
    type?: string;
  };
  // 视频生成相关字段（可选，保持向后兼容）
  video?: {
    taskId: string;
    prompt: string;
    model: string;
    duration: string;
    status: "pending" | "success" | "failed";
    url?: string; // 视频播放URL
    coverUrl?: string; // 视频封面图URL
    sourceImageBase64: string; // 用于生成视频的原始图片
  };

  createdAt: number;
  // MuleRun会话ID（可选，用于隔离不同会话的历史记录）
  mulerunSessionId?: string;
};

export type AddHistory = Omit<History, "id" | "createdAt">;
