import { useRef, useCallback } from "react";

export function useFrameSender(videoRef, sendFn, interval = 100) {
  const timerRef = useRef(null);

  const start = useCallback(() => {
    const sendFrame = () => {
      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      const frameData = canvas.toDataURL("image/jpeg", 0.8);
      sendFn(frameData);

      timerRef.current = setTimeout(sendFrame, interval);
    };

    sendFrame();
  }, [videoRef, sendFn, interval]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { start, stop };
}
