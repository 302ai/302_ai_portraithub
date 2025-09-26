export interface MediaItemType {
  id: string;
  title: string;
  desc: string;
  url?: string;
  base64?: string;
  tag?: string;
  historyId?: string;
  status?: "pending" | "success" | "failed";
  type?: string;
  model?: string;
  // 视频相关字段
  videoUrl?: string;
  coverUrl?: string;
}

export interface BaseProps {
  className?: string;
}

export interface ActionProps {
  onDelete?: (item: MediaItemType) => void;
  onDownload?: (item: MediaItemType) => void;
}

export interface GalleryProps extends ActionProps {
  mediaItems: MediaItemType[];
  title: string;
  description: string;
  insertAtStart?: boolean;
  emptyStateMessage?: string;
  pageSize?: number;
  onVideoGenerated?: (
    taskId: string,
    videoData: {
      prompt: string;
      model: string;
      duration: string;
      sourceImageBase64: string;
      originalImageType: string;
      originalImageModel: string;
    }
  ) => void; // 视频生成回调
}

export interface MediaItemProps extends BaseProps, ActionProps {
  item: MediaItemType;
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
  showActions?: boolean;
  showTag?: boolean;
  onVideoGenerated?: (
    taskId: string,
    videoData: {
      prompt: string;
      model: string;
      duration: string;
      sourceImageBase64: string;
      originalImageType: string;
      originalImageModel: string;
    }
  ) => void; // 视频生成回调
}

export interface GalleryModalProps extends ActionProps {
  selectedItem: MediaItemType;
  isOpen: boolean;
  onClose: () => void;
  setSelectedItem: (item: MediaItemType | null) => void;
  mediaItems: MediaItemType[];
  showDelete?: boolean;
  showContent?: boolean;
}
