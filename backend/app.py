from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from drowsiness_detector import DrowsinessDetector

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    detector = DrowsinessDetector()

    try:
        while True:
            data = await websocket.receive_text()
            result = detector.process_frame(data)
            await websocket.send_json(result)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await websocket.close()
