"""
SerpApi provider — Google Lens + Image API + Immersive Product + Shopping.

Pipeline:
  Image file → SerpApi Image API → image_id → Google Lens → candidates
  product_id → Immersive Product → reviews/ratings/stores
  query → Google Shopping → prices/stores
"""

import httpx
import asyncio
import logging
from pathlib import Path
from app.config import settings

logger = logging.getLogger(__name__)

SERPAPI_BASE = settings.SERPAPI_BASE_URL


class SerpApiProvider:
    """Handles all SerpApi interactions with retry and rate limiting."""

    def __init__(self):
        self.api_key = settings.SERPAPI_API_KEY
        self.timeout = settings.SERPAPI_TIMEOUT_SECONDS
        self.max_retries = settings.SERPAPI_MAX_RETRIES
        self._last_request_time = 0

    async def _rate_limit(self):
        """Enforce ~1 request/sec to SerpApi."""
        import time
        now = time.time()
        elapsed = now - self._last_request_time
        if elapsed < 1.0:
            await asyncio.sleep(1.0 - elapsed)
        self._last_request_time = time.time()

    async def _request(self, params: dict) -> dict:
        """Make a GET request to SerpApi with retry + exponential backoff."""
        params["api_key"] = self.api_key
        params["output"] = "json"

        for attempt in range(self.max_retries):
            try:
                await self._rate_limit()
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(f"{SERPAPI_BASE}/search", params=params)
                    resp.raise_for_status()
                    return resp.json()
            except httpx.HTTPStatusError as e:
                logger.warning(f"SerpApi HTTP {e.response.status_code} (attempt {attempt+1})")
                if e.response.status_code == 429 or e.response.status_code >= 500:
                    await asyncio.sleep(2 ** attempt)
                    continue
                raise
            except httpx.RequestError as e:
                logger.warning(f"SerpApi request error (attempt {attempt+1}): {e}")
                await asyncio.sleep(2 ** attempt)
                continue

        raise RuntimeError("SerpApi request failed after max retries")

    # ─── IMAGE API ────────────────────────────────────────────────────

    async def upload_image(self, image_path: str) -> str:
        """
        Upload image to SerpApi Image API → get image_id.
        Image must be ≤500 KB. Returns the image_id string.
        The image_id expires after ~10 minutes.
        """
        file_path = Path(image_path)
        if not file_path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")

        file_size_kb = file_path.stat().st_size / 1024
        if file_size_kb > settings.SERPAPI_MAX_IMAGE_KB:
            raise ValueError(
                f"Image too large for SerpApi: {file_size_kb:.0f} KB "
                f"(max {settings.SERPAPI_MAX_IMAGE_KB} KB). Compress first."
            )

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            with open(file_path, "rb") as f:
                files = {"image": (file_path.name, f, "image/jpeg")}
                resp = await client.post(
                    f"{SERPAPI_BASE}/image",
                    files=files,
                    data={"api_key": self.api_key},
                )
                resp.raise_for_status()
                data = resp.json()

        image_id = data.get("image_id") or data.get("url") or data.get("search_metadata", {}).get("image_id", "")
        if not image_id:
            # Fallback: some SerpApi responses put the URL directly
            image_id = data.get("image_url", "")

        if not image_id:
            logger.error(f"SerpApi Image API response: {data}")
            raise RuntimeError("Failed to get image_id from SerpApi Image API")

        logger.info(f"Uploaded image, got ID: {image_id[:30]}...")
        return image_id

    # ─── GOOGLE LENS ──────────────────────────────────────────────────

    async def google_lens_search(self, image_id: str) -> dict:
        """
        Google Lens visual product search.
        Returns full response with visual_matches, shopping_results, etc.
        """
        # Determine if image_id is a URL or an ID
        params = {
            "engine": "google_lens",
            "type": "products",
        }

        if image_id.startswith("http"):
            params["url"] = image_id
        else:
            params["image_id"] = image_id

        return await self._request(params)

    def parse_lens_candidates(self, lens_data: dict) -> list[dict]:
        """Extract product candidates from Google Lens response."""
        candidates = []

        # Visual matches
        for i, item in enumerate(lens_data.get("visual_matches", [])):
            candidates.append({
                "title": item.get("title", ""),
                "source": item.get("source", ""),
                "link": item.get("link", ""),
                "rating": item.get("rating"),
                "reviews": item.get("reviews"),
                "price": item.get("price", {}).get("extracted_value") if isinstance(item.get("price"), dict) else item.get("price"),
                "price_display": item.get("price", {}).get("value", "") if isinstance(item.get("price"), dict) else str(item.get("price", "")),
                "thumbnail": item.get("thumbnail", ""),
                "in_stock": item.get("in_stock"),
                "position": i,
                "match_type": "visual_match",
            })

        # Shopping results (if present)
        for i, item in enumerate(lens_data.get("shopping_results", [])):
            candidates.append({
                "title": item.get("title", ""),
                "source": item.get("source", ""),
                "link": item.get("link", ""),
                "rating": item.get("rating"),
                "reviews": item.get("reviews"),
                "price": item.get("price", {}).get("extracted_value") if isinstance(item.get("price"), dict) else item.get("price"),
                "price_display": item.get("price", {}).get("value", "") if isinstance(item.get("price"), dict) else str(item.get("price", "")),
                "thumbnail": item.get("thumbnail", ""),
                "in_stock": item.get("in_stock"),
                "position": len(candidates) + i,
                "match_type": "shopping_result",
            })

        return candidates

    # ─── IMMERSIVE PRODUCT ─────────────────────────────────────────────

    async def get_immersive_product(self, product_id: str, more_stores: bool = True) -> dict:
        """
        Get detailed product info including reviews, ratings, stores.
        product_id comes from Google Lens/Shopping results.
        """
        params = {
            "engine": "google_immersive_product",
            "product_id": product_id,
        }
        if more_stores:
            params["more_stores"] = "true"

        return await self._request(params)

    def parse_immersive_product(self, data: dict) -> dict:
        """Parse the immersive product response into structured data."""
        product_info = {}

        # Basic product info
        product_results = data.get("product_results", {})
        product_info["name"] = product_results.get("title", "")
        product_info["brand"] = product_results.get("brand", "")
        product_info["rating"] = product_results.get("rating")
        product_info["review_count"] = product_results.get("reviews")
        product_info["description"] = product_results.get("description", "")
        product_info["category"] = product_results.get("category", "")

        # Media
        product_info["images"] = product_results.get("media", [])

        # Prices and stores
        stores = []
        for store in data.get("sellers_results", {}).get("online_sellers", []):
            stores.append({
                "source": store.get("name", ""),
                "price": store.get("base_price", store.get("price")),
                "price_display": store.get("price", ""),
                "link": store.get("link", ""),
                "rating": store.get("rating"),
                "reviews": store.get("reviews"),
                "in_stock": store.get("in_stock"),
            })
        product_info["stores"] = stores

        # Pros and cons (from Google's aggregation)
        product_info["pros"] = []
        product_info["cons"] = []
        for highlight in data.get("product_results", {}).get("highlights", []):
            if isinstance(highlight, dict):
                if highlight.get("type") == "pros":
                    product_info["pros"].extend(highlight.get("items", []))
                elif highlight.get("type") == "cons":
                    product_info["cons"].extend(highlight.get("items", []))
            elif isinstance(highlight, str):
                product_info["pros"].append(highlight)

        # Reviews from immersive product
        reviews_data = data.get("reviews_results", {})
        product_info["review_highlights"] = reviews_data.get("highlights", [])
        product_info["reviews_raw"] = reviews_data.get("reviews", [])
        product_info["star_distribution"] = reviews_data.get("ratings", [])

        # Specifications
        specs = {}
        for spec in data.get("product_results", {}).get("specifications", []):
            if isinstance(spec, dict):
                for k, v in spec.items():
                    specs[k] = v
        product_info["specifications"] = specs

        # Variants
        product_info["variants"] = data.get("product_results", {}).get("variants", [])

        return product_info

    # ─── GOOGLE SHOPPING ───────────────────────────────────────────────

    async def google_shopping_search(self, query: str, gl: str = "in") -> dict:
        """Search Google Shopping for price comparison."""
        params = {
            "engine": "google_shopping",
            "q": query,
            "gl": gl,
            "hl": "en",
        }
        return await self._request(params)

    def parse_shopping_results(self, data: dict) -> list[dict]:
        """Parse Google Shopping results for prices."""
        results = []
        for item in data.get("shopping_results", []):
            results.append({
                "title": item.get("title", ""),
                "source": item.get("source", ""),
                "link": item.get("link", ""),
                "product_id": item.get("product_id", ""),
                "price": item.get("extracted_price"),
                "price_display": item.get("price", ""),
                "rating": item.get("rating"),
                "reviews": item.get("reviews"),
                "snippet": item.get("snippet", ""),
                "thumbnail": item.get("thumbnail", ""),
                "delivery": item.get("delivery", ""),
            })
        return results


    # ─── GOOGLE SEARCH & REVIEWS ──────────────────────────────────────

    async def google_search(self, query: str, gl: str = "in", hl: str = "en") -> dict:
        """Search Google Search for reviews, snippets, and retailer feedback."""
        params = {
            "engine": "google",
            "q": query,
            "gl": gl,
            "hl": hl,
        }
        return await self._request(params)

    def parse_search_reviews(self, data: dict) -> list[dict]:
        """Extract customer reviews and feedback snippets from Google Search."""
        reviews = []
        for item in data.get("organic_results", []):
            snippet = item.get("snippet", "")
            title = item.get("title", "")
            source = item.get("displayed_link", item.get("source", ""))
            link = item.get("link", "")
            rich_snippet = item.get("rich_snippet", {}) or {}

            # Extract rating if present in rich snippet
            rating = None
            if rich_snippet:
                top_ext = rich_snippet.get("top", {}).get("detected_extensions", {})
                bottom_ext = rich_snippet.get("bottom", {}).get("detected_extensions", {})
                rating = top_ext.get("rating") or bottom_ext.get("rating")

            if snippet and len(snippet) > 20:
                reviews.append({
                    "title": title,
                    "content": snippet,
                    "source": source,
                    "link": link,
                    "rating": rating,
                })
        return reviews


# Module-level singleton
serpapi = SerpApiProvider()
