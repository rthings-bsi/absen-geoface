"use client";

import { useState, useEffect, useCallback } from "react";

interface MediaPipeState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  modelLoaded: boolean;
}

export function useMediaPipe() {
  const [state, setState] = useState<MediaPipeState>({
    initialized: false,
    loading: false,
    error: null,
    modelLoaded: false,
  });

  const init = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // MediaPipe will be loaded dynamically in client component
      // For now, we simulate initialization
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setState({
        initialized: true,
        loading: false,
        error: null,
        modelLoaded: true,
      });
    } catch (error: any) {
      setState({
        initialized: false,
        loading: false,
        error: error?.message || "Gagal menginisialisasi MediaPipe",
        modelLoaded: false,
      });
    }
  }, []);

  useEffect(() => {
    // Don't auto-initialize, let the component decide when to init
  }, [init]);

  return {
    ...state,
    init,
  };
}
