import { useRef, useCallback } from "react";

export function useCamera() {
  const videoRef = useRef(null);

  const startCamera = useCallback(async (width = 640, height = 480) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width, height },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return true;
    } catch (err) {
      alert("Error accessing camera: " + err.message);
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  return { videoRef, startCamera, stopCamera };
}
