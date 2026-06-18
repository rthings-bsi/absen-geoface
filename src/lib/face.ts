/**
 * Face Detection Utilities using MediaPipe Tasks Vision
 * Mendukung face detection dan similarity comparison
 */

export interface FaceDetectionResult {
  boundingBox: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
  keypoints?: Array<{ x: number; y: number }>;
  confidence: number;
}

export interface FaceDescriptor {
  data: number[];
  confidence: number;
  timestamp: number;
}

/**
 * Inisialisasi Face Detector (MediaPipe Tasks Vision)
 * Untuk sekarang kita gunakan placeholder karena MediaPipe Tasks Vision
 * memerlukan loading model dari CDN yang async
 */
export async function initFaceDetector(): Promise<any> {
  // Placeholder - MediaPipe akan di-load di client component
  return {
    initialized: true,
    modelLoaded: false,
  };
}

/**
 * Mendeteksi wajah dari video element
 * Menggunakan MediaPipe Face Detection
 */
export async function detectFace(
  video: HTMLVideoElement
): Promise<FaceDetectionResult | null> {
  try {
    // Simulasi deteksi wajah
    // Dalam implementasi nyata, akan menggunakan MediaPipe FaceDetector
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);

    // Placeholder: return mock detection
    // MediaPipe integration will be added in client component
    return {
      boundingBox: {
        originX: video.videoWidth * 0.2,
        originY: video.videoHeight * 0.1,
        width: video.videoWidth * 0.6,
        height: video.videoHeight * 0.7,
      },
      confidence: 0.85,
    };
  } catch (error) {
    console.error("Face detection error:", error);
    return null;
  }
}

/**
 * Cek kualitas kamera berdasarkan lighting dan face visibility
 */
export async function checkCameraQuality(
  video: HTMLVideoElement
): Promise<number> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;

    ctx.drawImage(video, 0, 0, 100, 100);
    const imageData = ctx.getImageData(0, 0, 100, 100);
    const data = imageData.data;

    // Calculate average brightness
    let totalBrightness = 0;
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;
      pixelCount++;
    }

    const avgBrightness = totalBrightness / pixelCount;

    // Good lighting is between 80-200
    let quality = 0;
    if (avgBrightness >= 80 && avgBrightness <= 200) {
      quality = 0.9;
    } else if (avgBrightness < 80) {
      quality = 0.5;
    } else {
      quality = 0.6;
    }

    return Math.min(quality, 1);
  } catch (error) {
    console.error("Camera quality check error:", error);
    return 0;
  }
}

/**
 * Bandingkan dua face descriptor menggunakan Euclidean distance
 */
export function compareFaces(
  desc1: number[],
  desc2: number[]
): { distance: number; similarity: number } {
  if (desc1.length !== desc2.length) {
    throw new Error("Face descriptors must have the same length");
  }

  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }

  const distance = Math.sqrt(sum);
  const similarity = 1 / (1 + distance);

  return { distance, similarity };
}

/**
 * Generate random face descriptor (placeholder untuk demo)
 * Dalam implementasi nyata, descriptor dihasilkan dari MediaPipe
 */
export function generateFaceDescriptor(confidence: number = 0.85): FaceDescriptor {
  // Generate 128-dimension vector (like face-api.js)
  const data = Array.from({ length: 128 }, () =>
    Math.random() * 2 - 1 // Values between -1 and 1
  );

  return {
    data,
    confidence,
    timestamp: Date.now(),
  };
}

/**
 * Verifikasi wajah - cek apakah cocok dengan threshold
 */
export function verifyFaceMatch(
  capturedDescriptor: number[],
  storedDescriptor: number[],
  threshold: number = 0.55
): boolean {
  const { distance } = compareFaces(capturedDescriptor, storedDescriptor);
  return distance < threshold;
}

/**
 * Threshold constants
 */
export const FACE_THRESHOLDS = {
  VERIFICATION: 0.65, // Euclidean distance threshold for face match — dinaikkan dari 0.55 untuk toleransi cahaya/angle
  CAMERA_QUALITY_MIN: 0.50, // Minimum camera quality for attendance
  CAMERA_QUALITY_REGISTRATION: 0.55, // Higher quality for registration
  CONFIDENCE_MIN: 0.50, // Minimum confidence score
};
