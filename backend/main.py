import os
from dotenv import load_dotenv
import uvicorn
from app import app

load_dotenv()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
