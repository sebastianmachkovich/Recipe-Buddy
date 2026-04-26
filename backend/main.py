"""Recipe Buddy FastAPI Application - Structured Setup."""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.router import router as api_router
from app.database import Base, engine

# Create tables if they don't exist.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Recipe Buddy API",
    description="AI-powered recipe suggestion API",
    version="1.0.0",
)

# Configure CORS to allow frontend requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    msg = "; ".join([err.msg for err in exc.errors()])
    return JSONResponse(
        status_code=422,
        content={"message": msg},
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail},
    )

@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Recipe Buddy API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "database": "ready"}


@app.get("/api/test")
def test_endpoint():
    """Test endpoint to verify API is working."""
    return {"message": "API is working! Start building your features here."}


app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn

    print("\n🚀 Starting Recipe Buddy Backend...")
    print("📍 Server: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
