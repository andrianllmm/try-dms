import { useEffect } from "react";

export default function VideoCanvas({ videoRef, canvasRef, frameData }) {
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !frameData) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw face landmarks
    if (frameData.landmarks?.length > 0) {
      // All landmarks (cyan)
      ctx.fillStyle = "rgba(0, 188, 212, 0.2)";
      frameData.landmarks.forEach((lm) => {
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Eye outlines
      ctx.strokeStyle = frameData.is_drowsy
        ? "rgba(255, 82, 82, 0.5)"
        : "rgba(0, 188, 212, 0.5)";
      ctx.lineWidth = 2;

      const drawEye = (indices) => {
        ctx.beginPath();
        indices.forEach((idx, i) => {
          const lm = frameData.landmarks[idx];
          const x = lm.x * canvas.width;
          const y = lm.y * canvas.height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();
      };

      drawEye(frameData.left_eye_indices);
      drawEye(frameData.right_eye_indices);
    }
  }, [frameData, videoRef, canvasRef]);

  return (
    <canvas ref={canvasRef} width={640} height={480} className="video-canvas" />
  );
}
