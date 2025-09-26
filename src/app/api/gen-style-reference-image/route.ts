import { createScopedLogger } from "@/utils";
import { env } from "@/env";
import ky from "ky";
import { APICallError } from "ai";
import { ErrorToast } from "@/components/ui/errorToast";

const logger = createScopedLogger("gen-style-reference-image");

// Helper function to convert URL to File object
const urlToFile = async (url: string, filename: string): Promise<File> => {
  // Fetch the image
  const response = await fetch(url);
  const blob = await response.blob();

  // Create File object from blob
  return new File([blob], filename, { type: blob.type });
};

// Helper function to convert image URL to base64
const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
      originImage,
      referenceImage,
      apiKey,
    }: {
      originImage: string;
      referenceImage: string;
      apiKey: string;
    } = await request.json();

    // Create FormData
    const formdata = new FormData();

    try {
      // Create an array to hold both images
      const imageFiles = [];
      let originalImageFile;

      // Convert origin image URL to File object
      if (originImage && originImage.startsWith("http")) {
        const filename = originImage.split("/").pop() || "image1.jpg";
        const imageFile = await urlToFile(originImage, filename);
        originalImageFile = imageFile;
        imageFiles.push(imageFile);
      } else {
        // Handle case where originImage is already a File or base64
        originalImageFile = originImage;
        imageFiles.push(originImage);
      }

      // Convert reference image URL to File object
      if (referenceImage && referenceImage.startsWith("http")) {
        const filename = referenceImage.split("/").pop() || "image2.jpg";
        const referenceFile = await urlToFile(referenceImage, filename);
        imageFiles.push(referenceFile);
      } else {
        // Handle case where referenceImage is already a File or base64
        imageFiles.push(referenceImage);
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
      const textPrompt =
        "Apply the style of the second image in the image array (index 1) to the first image (index 0).";
      formdata.append("prompt", textPrompt);

      // Add other required parameters
      formdata.append("model", "gpt-image-1");
      formdata.append("quality", "auto");
      formdata.append("size", imageSize);

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

      // Parse the response to get the image URL
      const responseData = JSON.parse(result);
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
