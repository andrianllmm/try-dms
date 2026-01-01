import { useRef, useCallback } from "react";

export function useWebSocket(url, onMessage) {
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => console.log("WebSocket connected");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    };
    ws.onerror = () => console.error("WebSocket error");
    ws.onclose = () => console.log("WebSocket disconnected");

    wsRef.current = ws;
  }, [url, onMessage]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  return { connect, send, disconnect, wsRef };
}
