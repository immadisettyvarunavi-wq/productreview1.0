"""
Product Review Intelligence — FastAPI Application.

Image → Real Product → Real Customer Reviews → Evidence-Based AI Summary
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pathlib import Path

from app.config import settings
from app.database import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("Starting Product Review Intelligence...")
    await init_db()
    settings.ensure_upload_dir()
    logger.info("Database initialized, upload directory ready.")

    # Log configuration (never log secrets)
    logger.info(f"SerpApi configured: {'YES' if settings.SERPAPI_API_KEY else 'NO'}")
    logger.info(f"HuggingFace configured: {'YES' if settings.HUGGINGFACE_API_KEY else 'NO'}")
    logger.info(f"Database: {settings.DATABASE_URL}")

    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Product Review Intelligence",
    description="Image → Real Product → Real Customer Reviews → Evidence-Based AI Summary",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — allow frontend dev server, Render domains, custom domains, and mobile webview
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*|capacitor://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded images
uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Import and include routers
from app.api.upload import router as upload_router
from app.api.products import router as products_router
from app.api.reviews import router as reviews_router
from app.api.analysis import router as analysis_router

app.include_router(upload_router, prefix="/api/v1/products", tags=["Upload & Analysis"])
app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])
app.include_router(reviews_router, prefix="/api/v1/products", tags=["Reviews"])
app.include_router(analysis_router, prefix="/api/v1/products", tags=["Analysis"])


@app.get("/api/v1/health")
async def health():
    """API health check with configuration status."""
    return {
        "status": "healthy",
        "serpapi_configured": bool(settings.SERPAPI_API_KEY),
        "llm_configured": bool(settings.HUGGINGFACE_API_KEY),
        "database": "sqlite",
    }


# Serve built React frontend if dist directory exists (Unified single-service deployment)
from fastapi.responses import FileResponse

frontend_dist_root = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
frontend_dist_local = Path(__file__).resolve().parent.parent / "dist"
frontend_dist = frontend_dist_root if (frontend_dist_root / "index.html").exists() else frontend_dist_local

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    # Mount assets subfolder if present
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/")
    async def serve_root():
        """Serve index.html at root for single-service deployment."""
        return FileResponse(str(frontend_dist / "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        """Serve frontend static files or fallback to index.html for SPA routing."""
        # Never intercept API, uploads, or docs routes
        if full_path.startswith("api") or full_path.startswith("uploads") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        target_file = frontend_dist / full_path
        if target_file.is_file():
            return FileResponse(str(target_file))
        return FileResponse(str(frontend_dist / "index.html"))
else:
    @app.get("/")
    async def root():
        """Backend root health status."""
        return {
            "name": "Product Review Intelligence",
            "version": "1.0.0",
            "status": "running",
            "frontend": "deployed_separately_or_dist_not_built",
            "docs": "/docs",
            "health": "/api/v1/health",
        }

