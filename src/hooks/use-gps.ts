"use client";

import { useState, useEffect, useCallback } from "react";

interface GpsState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  timestamp: number | null;
}

interface UseGpsOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGps(options: UseGpsOptions = {}) {
  const [state, setState] = useState<GpsState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
    timestamp: null,
  });

  const { enableHighAccuracy = true, timeout = 10000, maximumAge = 0 } = options;

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocation tidak didukung oleh browser ini",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let errorMessage = "Gagal mendapatkan lokasi";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Izin lokasi ditolak";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informasi lokasi tidak tersedia";
            break;
          case error.TIMEOUT:
            errorMessage = "Waktu habis untuk mendapatkan lokasi";
            break;
        }
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  useEffect(() => {
    getPosition();
  }, [getPosition]);

  return {
    ...state,
    refresh: getPosition,
    isAvailable: !!navigator.geolocation,
  };
}
