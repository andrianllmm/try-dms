import { useState, useRef, useCallback } from "react";
import "./App.css";
import { useCamera } from "./hooks/useCamera";
import { useWebSocket } from "./hooks/useWebSocket";
import { useFrameSender } from "./hooks/useFrameSender";
import VideoCanvas from "./components/VideoCanvas";

function App() {
  const { videoRef, startCamera, stopCamera } = useCamera();
  const canvasRef = useRef(null);

  const [isRunning, setIsRunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(
    "Click Start to begin monitoring"
  );
  const [frameData, setFrameData] = useState(null);
  const [stats, setStats] = useState({
    ear: "--",
    status: "--",
    isDrowsy: false,
  });

  // WebSocket setup
  const { connect, send, disconnect } = useWebSocket(
    "ws://localhost:8001/ws",
    (data) => {
      setFrameData(data);
      setStats({
        ear: data.ear || "--",
        status: data.message || "--",
        isDrowsy: data.is_drowsy,
      });
    }
  );

  // Frame sender setup
  const { start: startSending, stop: stopSending } = useFrameSender(
    videoRef,
    send
  );

  const toggleMonitoring = useCallback(async () => {
    if (!isRunning) {
      const cameraOk = await startCamera();
      if (!cameraOk) return;

      connect();
      startSending();
      setIsRunning(true);
      setConnectionStatus("Connected - Monitoring active");
    } else {
      stopSending();
      stopCamera();
      disconnect();
      setIsRunning(false);
      setConnectionStatus("Click Start to begin monitoring");
      setStats({
        ear: "--",
        status: "--",
        isDrowsy: false,
      });
      setFrameData(null);

      // Clear canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [
    isRunning,
    startCamera,
    stopCamera,
    connect,
    disconnect,
    startSending,
    stopSending,
  ]);

  return (
    <div className="app">
      <h1>Driver Monitoring System</h1>

      <video ref={videoRef} style={{ display: "none" }} />

      <VideoCanvas
        videoRef={videoRef}
        canvasRef={canvasRef}
        frameData={frameData}
      />

      <div className="stats">
        <div className="stat-item">
          <div className="stat-label">EAR Score</div>
          <div className="stat-value">{stats.ear}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Status</div>
          <div className={`stat-value ${stats.isDrowsy ? "drowsy" : "alert"}`}>
            {stats.status}
          </div>
        </div>
      </div>

      <div
        className={`status ${
          connectionStatus.includes("Connected") ? "connected" : ""
        }`}
      >
        {connectionStatus}
      </div>

      <button onClick={toggleMonitoring}>
        {isRunning ? "Stop Monitoring" : "Start Monitoring"}
      </button>
    </div>
  );
}

export default App;
