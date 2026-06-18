"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Hook untuk face detection + recognition menggunakan face-api.js (client-side)
 *
 * Model face-api.js di-load dari /public/models/face-api/
 *
 * Returns:
 * - modelsLoaded: boolean — apakah model sudah siap
 * - modelError: string | null — error saat loading model
 * - loadModels(): function — trigger load model (dipanggil otomatis di mount)
 * - detectFace(video): function — deteksi wajah, return { descriptor, confidence } | null
 */
export function useFaceRecognition() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const loadedRef = useRef(false);
  const faceapiRef = useRef<typeof import("@vladmandic/face-api") | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (loadedRef.current) return;
      loadedRef.current = true;

      try {
        const faceapi = await import("@vladmandic/face-api");
        faceapiRef.current = faceapi;

        const MODEL_URL = "/models/face-api";

        // Load model yang diperlukan: detection, landmark, recognition
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        if (!cancelled) {
          setModelsLoaded(true);
          setModelError(null);
        }
      } catch (err) {
        console.error("Failed to load face-api models:", err);
        if (!cancelled) {
          setModelError(
            err instanceof Error
              ? err.message
              : "Gagal memuat model pengenalan wajah"
          );
          loadedRef.current = false; // allow retry
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Deteksi wajah dari video element.
   * Returns:
   * - descriptor: number[] (128 elemen)
   * - confidence: number (0-100)
   * Atau null jika tidak ada wajah terdeteksi.
   */
  const detectFace = useCallback(
    async (
      video: HTMLVideoElement
    ): Promise<{ descriptor: number[]; confidence: number } | null> => {
      const faceapi = faceapiRef.current;
      if (!faceapi || !modelsLoaded) {
        console.warn("Face-api models not loaded yet");
        return null;
      }

      try {
        const result = await faceapi
          .detectSingleFace(video)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!result) {
          console.warn("No face detected in frame");
          return null;
        }

        const descriptor = Array.from(result.descriptor); // Float32Array → number[]
        const confidence = Math.round(result.detection.score * 100); // 0-100

        return { descriptor, confidence };
      } catch (err) {
        console.error("Face detection error:", err);
        return null;
      }
    },
    [modelsLoaded]
  );

  /**
   * Dapatkan face descriptor untuk diregistrasi (kualitas tinggi).
   * Melakukan loop dengan maxAttempts percobaan
   */
  const registerFace = useCallback(
    async (
      video: HTMLVideoElement,
      maxAttempts: number = 3
    ): Promise<{ descriptor: number[]; confidence: number } | null> => {
      for (let i = 0; i < maxAttempts; i++) {
        // Beri jeda antar percobaan agar kamera stabil
        await new Promise((r) => setTimeout(r, 500));

        const result = await detectFace(video);
        if (result && result.confidence >= 85) {
          return result;
        }
      }
      // Return attempt terakhir meski confidence rendah
      return detectFace(video);
    },
    [detectFace]
  );

  return {
    modelsLoaded,
    modelError,
    detectFace,
    registerFace,
  };
}
