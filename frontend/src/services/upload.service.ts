import { API_BASE_URL, apiClient } from "./api";

export const MAX_UPLOAD_IMAGES = 10;
export const MAX_UPLOAD_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_UPLOAD_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type UploadImagesResponse =
  | {
      ok: true;
      images: string[];
    }
  | {
      ok: false;
      message: string;
    };

export type ImageValidationResult = {
  validFiles: File[];
  errors: string[];
};

export function validateImageFiles(
  files: File[],
  currentCount = 0,
  options: { min?: number; max?: number } = {},
): ImageValidationResult {
  const min = options.min ?? 0;
  const max = options.max ?? MAX_UPLOAD_IMAGES;
  const errors: string[] = [];
  const validFiles: File[] = [];
  const remainingSlots = Math.max(max - currentCount, 0);

  if (files.length < min) {
    errors.push("Debes subir al menos una imagen.");
  }

  files.forEach((file) => {
    if (!ALLOWED_UPLOAD_IMAGE_TYPES.includes(file.type)) {
      errors.push(`El archivo ${file.name} no es valido. Usa JPG, PNG o WebP.`);
      return;
    }

    if (file.size > MAX_UPLOAD_IMAGE_SIZE_BYTES) {
      errors.push(`El archivo ${file.name} excede los 5 MB.`);
      return;
    }

    validFiles.push(file);
  });

  if (currentCount + validFiles.length > max) {
    errors.push(`Solo puedes subir hasta ${max} imagenes.`);
  }

  return {
    validFiles: validFiles.slice(0, remainingSlots),
    errors,
  };
}

export function normalizeUploadedImageUrl(image: string): string {
  if (/^https?:\/\//i.test(image) || image.startsWith("data:")) {
    return image;
  }

  if (image.startsWith("/uploads/") || image.startsWith("uploads/")) {
    const apiOrigin = API_BASE_URL.replace(/\/api$/, "");
    return `${apiOrigin}/${image.replace(/^\/+/, "")}`;
  }

  return image;
}

export function uploadImages(
  images: File[],
  onProgress?: (progress: number) => void,
): Promise<UploadImagesResponse> {
  const formData = new FormData();

  images.forEach((file) => {
    formData.append("images", file);
  });

  return apiClient
    .post<UploadImagesResponse>("uploads/images", formData, {
      onUploadProgress: (event) => {
        if (!event.total) return;
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    })
    .then((response) => {
      const data = response.data;
      if (!data.ok) return data;

      return {
        ok: true,
        images: data.images.map(normalizeUploadedImageUrl),
      };
    });
}
