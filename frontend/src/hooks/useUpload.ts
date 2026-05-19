import {
  uploadImages,
  validateImageFiles,
  type ImageValidationResult,
  type UploadImagesResponse,
} from "../services/upload.service";

export function useUpload() {
  return {
    uploadImages,
    validateImageFiles,
  };
}

export type { ImageValidationResult, UploadImagesResponse };
