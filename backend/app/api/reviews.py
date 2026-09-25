"""Review API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.review import Review

router = APIRouter()


@router.get("/{product_id}/reviews")
async def get_product_reviews(
    product_id: int,
    source: str = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Get reviews for a product, optionally filtered by source."""
    stmt = select(Review).where(Review.product_id == product_id)

    if source:
        stmt = stmt.where(Review.source == source)

    stmt = stmt.order_by(Review.retrieved_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    reviews = result.scalars().all()

    return {
        "product_id": product_id,
        "count": len(reviews),
        "reviews": [
            {
                "id": r.id,
                "review_id": r.source_review_id,
                "source": r.source,
                "source_url": r.source_url,
                "rating": r.rating,
                "title": r.title,
                "content": r.content,
                "date": r.review_date,
                "verified_purchase": r.verified_purchase,
                "helpful_votes": r.helpful_votes,
                "variant": r.variant,
                "language": r.language,
            }
            for r in reviews
        ],
    }
