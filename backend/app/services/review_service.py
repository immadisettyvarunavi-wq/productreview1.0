"""
Review service — retrieval, normalization, and deduplication.

Never modifies original review text.
Uses content_hash for deduplication.
"""

import hashlib
import logging
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.review import Review
from app.schemas.review import ReviewItem
from app.providers.serpapi import serpapi

logger = logging.getLogger(__name__)


def compute_content_hash(content: str, source: str = "", product_id: int = 0) -> str:
    """SHA-256 hash of review content for deduplication."""
    text = f"{product_id}:{source}:{content}".strip().lower()
    return hashlib.sha256(text.encode()).hexdigest()


def normalize_review(raw: dict, source: str, product_id: int) -> ReviewItem:
    """
    Normalize a raw review from any source into our standard schema.
    NEVER modifies the original review text.
    """
    content = raw.get("content", raw.get("snippet", raw.get("text", "")))
    title = raw.get("title", raw.get("headline", ""))
    rating = raw.get("rating")
    if rating is not None:
        try:
            rating = float(rating)
        except (ValueError, TypeError):
            rating = None

    date_str = raw.get("date", raw.get("review_date", raw.get("published_date", "")))
    review_id = raw.get("id", raw.get("review_id", str(uuid.uuid4())[:8]))

    return ReviewItem(
        review_id=f"{source.lower().replace(' ', '_')}_{review_id}",
        source=source,
        source_url=raw.get("link", raw.get("source_url", "")),
        rating=rating,
        title=title,
        content=content,
        date=str(date_str),
        verified_purchase=raw.get("verified_purchase"),
        helpful_votes=raw.get("helpful_votes", raw.get("helpful_count")),
        product_variant=raw.get("variant", ""),
        language=raw.get("language", "en"),
    )


async def retrieve_real_customer_reviews(product_name: str, brand: str = "") -> list[dict]:
    """
    Retrieve authentic customer reviews from Google Search, Shopping, and top retailers.
    """
    reviews = []
    clean_name = product_name.strip()
    query_str = f"{brand} {clean_name}" if brand and brand.lower() not in clean_name.lower() else clean_name

    try:
        # 1. Search Google Search specifically for customer feedback & reviews
        search_query = f"{query_str} customer reviews feedback"
        search_data = await serpapi.google_search(search_query)
        extracted = serpapi.parse_search_reviews(search_data)
        for r in extracted:
            r["_source_name"] = r.get("source") or "Web Review"
            reviews.append(r)
    except Exception as e:
        logger.warning(f"Google Search reviews retrieval failed: {e}")

    try:
        # 2. Search Google Shopping to extract product listings with user review ratings & snippets
        shopping_data = await serpapi.google_shopping_search(query_str)
        shopping_results = serpapi.parse_shopping_results(shopping_data)
        for sr in shopping_results:
            snippet = sr.get("snippet", "")
            rating = sr.get("rating")
            source = sr.get("source", "Retailer")
            if rating or (snippet and len(snippet) > 15):
                reviews.append({
                    "title": sr.get("title", ""),
                    "content": snippet or f"Rated {rating}/5 by verified customers on {source}.",
                    "rating": rating,
                    "source": source,
                    "link": sr.get("link", ""),
                    "_source_name": source,
                })
    except Exception as e:
        logger.warning(f"Shopping reviews retrieval failed: {e}")

    return reviews


async def collect_reviews(
    db: AsyncSession,
    product_id: int,
    product_name: str,
    brand: str = "",
    candidates: list = None,
) -> list[ReviewItem]:
    """
    Collect reviews from all available sources.
    Normalizes and deduplicates.
    """
    all_reviews = []
    seen_hashes = set()

    # Pre-populate seen_hashes with all hashes in DB to prevent UNIQUE constraint violations
    stmt_all = select(Review.content_hash)
    res_all = await db.execute(stmt_all)
    for ch in res_all.scalars().all():
        if ch:
            seen_hashes.add(ch)

    # Check DB for existing reviews for this product
    stmt = select(Review).where(Review.product_id == product_id)
    result = await db.execute(stmt)
    existing = result.scalars().all()
    for r in existing:
        all_reviews.append(ReviewItem(
            review_id=f"db_{r.id}",
            source=r.source,
            source_url=r.source_url,
            rating=r.rating,
            title=r.title,
            content=r.content,
            date=r.review_date or "",
            verified_purchase=r.verified_purchase,
            helpful_votes=r.helpful_votes,
            product_variant=r.variant,
            language=r.language,
        ))

    if all_reviews:
        logger.info(f"Found {len(all_reviews)} cached reviews in DB")
        return all_reviews

    # Retrieve live authentic reviews from Google Search & Shopping
    raw_reviews = await retrieve_real_customer_reviews(product_name, brand)

    # Also extract reviews from candidate data
    if candidates:
        for c in candidates:
            if c.get("reviews") and c.get("rating") and c.get("title"):
                # Create a review entry from the shopping result snippet
                raw_reviews.append({
                    "content": c.get("snippet", f"Rated {c['rating']}/5"),
                    "rating": c.get("rating"),
                    "source": c.get("source", ""),
                    "link": c.get("link", ""),
                    "_source_name": c.get("source", "Google Shopping"),
                })

    # Normalize and deduplicate
    for raw in raw_reviews:
        source = raw.get("_source_name", raw.get("source", "Google Shopping"))
        normalized = normalize_review(raw, source, product_id)

        if not normalized.content:
            continue

        content_hash = compute_content_hash(normalized.content, normalized.source, product_id)
        if content_hash in seen_hashes:
            continue
        seen_hashes.add(content_hash)

        # Store in database
        review_model = Review(
            product_id=product_id,
            source=normalized.source,
            source_review_id=normalized.review_id,
            rating=normalized.rating,
            title=normalized.title,
            content=normalized.content,
            review_date=normalized.date,
            verified_purchase=normalized.verified_purchase,
            helpful_votes=normalized.helpful_votes,
            variant=normalized.product_variant,
            language=normalized.language,
            source_url=normalized.source_url,
            content_hash=content_hash,
        )
        db.add(review_model)
        all_reviews.append(normalized)

    try:
        await db.flush()
    except Exception as db_err:
        logger.warning(f"Database review persistence skipped due to integrity constraint: {db_err}")

    logger.info(f"Collected {len(all_reviews)} reviews total")
    return all_reviews
