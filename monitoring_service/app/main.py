from fastapi import FastAPI
from app.routes import router
from fastapi.middleware.cors import CORSMiddleware
import app.config as config

app = FastAPI(title="FastAPI Template", version="1.0.0")

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI Template"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.HOST, port=config.PORT, reload=True)
