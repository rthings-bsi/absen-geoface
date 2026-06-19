"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Deteksi apakah perangkat mobile berdasarkan user agent
 */
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Hook untuk face detection + recognition menggunakan face-api.js (client-side)
 *
 * Model face-api.js di-load dari /public/models/face-api/
 * - Primary: ssdMobilenetv1 (akurat, ~5.6MB)
 * - Fallback: tinyFaceDetector (ringan, ~190KB) — otomatis dipakai di HP
 *
 * Returns:
 * - modelsLoaded: boolean
 * - modelError: string | null
 * - usingFallback: boolean — true jika pakai tiny detector
 * - loadModels(): function — retry loading
 * - detectFace(video): { descriptor, confidence } | null
 * - registerFace(video): { descriptor, confidence } | null
 */
export function useFaceRecognition() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("");
  const loadedRef = useRef(false);
  const faceapiRef = useRef<typeof import("@vladmandic/face-api") | null>(null);
  const loadAttemptRef = useRef(0);

  const init = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadAttemptRef.current += 1;
    const attempt = loadAttemptRef.current;

    const isMobile = isMobileDevice();
    const MODEL_URL = "/models/face-api";

    try {
      const faceapi = await import("@vladmandic/face-api");
      faceapiRef.current = faceapi;

      // Di HP: coba SSD dulu, kalau gagal fallback ke tiny
      if (isMobile) {
        try {
          setLoadingProgress("Memuat model wajah (ringan)...");
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          ]);
          setUsingFallback(true);
        } catch {
          // Fallback gagal juga? Coba SSD
          try {
            setLoadingProgress("Memuat model wajah...");
            await Promise.all([
              faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
              faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
              faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            setUsingFallback(false);
          } catch {
            throw new Error("Gagal memuat model wajah. Periksa koneksi jaringan.");
          }
        }
      } else {
        // Desktop: SSD dulu
        try {
          setLoadingProgress("Memuat model wajah...");
          await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          ]);
          setUsingFallback(false);
        } catch {
          // Fallback ke tiny kalau gagal
          try {
            setLoadingProgress("Memuat model wajah (alternatif)...");
            await Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
              faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
              faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            setUsingFallback(true);
          } catch {
            throw new Error("Gagal memuat model wajah. Coba reload halaman.");
          }
        }
      }

      if (!loadedRef.current || attempt !== loadAttemptRef.current) return;

      setModelsLoaded(true);
      setModelError(null);
      setLoadingProgress("");
    } catch (err) {
      if (!loadedRef.current || attempt !== loadAttemptRef.current) return;

      const message =
        err instanceof Error ? err.message : "Gagal memuat model pengenalan wajah";
      setModelError(message);
      setLoadingProgress("");
      loadedRef.current = false; // allow retry
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    init();
    return () => {
      cancelled = true;
    };
  }, [init]);

  /** Muat ulang model (dipanggil manual dari komponen) */
  const loadModels = useCallback(() => {
    loadedRef.current = false;
    setModelError(null);
    setModelsLoaded(false);
    init();
  }, [init]);

  /**
   * Deteksi wajah dari video element.
   * Returns { descriptor, confidence } atau null.
   */
  const detectFace = useCallback(
    async (
      video: HTMLVideoElement
    ): Promise<{ descriptor: number[]; confidence: number } | null> => {
      const faceapi = faceapiRef.current;
      if (!faceapi || !modelsLoaded) return null;

      try {
        // Deteksi dengan input yang sesuai
        const detectionConfig = usingFallback
          ? { inputSize: 320, scoreThreshold: 0.5 }
          : { scoreThreshold: 0.5 };

        let result: any;

        if (usingFallback) {
          // @ts-ignore
          result = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
            .withFaceLandmarks(true)
            .withFaceDescriptor();
        } else {
          // @ts-ignore
          result = await faceapi
            .detectSingleFace(video)
            .withFaceLandmarks()
            .withFaceDescriptor();
        }

        if (!result) return null;

        // @ts-ignore
        const descriptor: number[] = Array.from(result.descriptor);
        const confidence = Math.round(result.detection.score * 100);

        return { descriptor, confidence };
      } catch (err) {
        console.error("Face detection error:", err);
        return null;
      }
    },
    [modelsLoaded, usingFallback]
  );

  /**
   * Dapatkan face descriptor untuk registrasi (kualitas tinggi).
   * Loop maxAttempts kali dengan jeda.
   * Di HP: lebih banyak percobaan karena kamera perlu waktu stabil.
   */
  const registerFace = useCallback(
    async (
      video: HTMLVideoElement,
      maxAttempts: number = isMobileDevice() ? 6 : 3,
      minConfidence: number = isMobileDevice() ? 70 : 85
    ): Promise<{ descriptor: number[]; confidence: number } | null> => {
      // Tunggu kamera stabil dulu
      await new Promise((r) => setTimeout(r, isMobileDevice() ? 1000 : 500));

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 600));

        const result = await detectFace(video);
        if (result && result.confidence >= minConfidence) {
          return result;
        }
      }

      // Return attempt terakhir
      return detectFace(video);
    },
    [detectFace]
  );

  return {
    modelsLoaded,
    modelError,
    usingFallback,
    loadingProgress,
    loadModels,
    detectFace,
    registerFace,
  };
}
