from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging, log_requests
from app.api.v1 import api_router

logger = setup_logging()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_request_logging(request, call_next):
    return await log_requests(request, call_next)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

try:
    from app.api.routes import auth, shippers, travelers
    app.include_router(auth.router, prefix="/api/auth", tags=["auth-legacy"])
    app.include_router(shippers.router, prefix="/api/shippers", tags=["shippers-legacy"])
    app.include_router(travelers.router, prefix="/api/travelers", tags=["travelers-legacy"])
except ImportError:
    pass

@app.get("/")
async def root():
    return {
        "message": f"{settings.APP_NAME} API is running",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "api_v1": settings.API_V1_PREFIX
    }

@app.get("/health")
async def health_check():
    
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

@app.on_event("startup")
async def startup_event():
    logger.info(f"{settings.APP_NAME} starting up...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"{settings.APP_NAME} shutting down...")