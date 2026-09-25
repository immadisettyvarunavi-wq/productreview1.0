"""Analysis API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.review import Review
from app.models.analysis import ReviewAnalysis
from app.services.llm_analysis import analyze_reviews_with_llm
from app.services.evidence import validate_evidence
from app.schemas.review import ReviewItem
from app.models.product import Product

router = APIRouter()


@router.post("/{product_id}/analyze-reviews")
async def analyze_product_reviews(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Trigger LLM review analysis for a product."""
    # Get product
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get reviews
    stmt = select(Review).where(Review.product_id == product_id)
    result = await db.execute(stmt)
    db_reviews = result.scalars().all()

    reviews = [
        ReviewItem(
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
        )
        for r in db_reviews
    ]

    if not reviews:
        return {
            "status": "insufficient_data",
            "message": "Product identified successfully, but insufficient customer-review data was found.",
            "analysis": None,
        }

    # Run analysis
    analysis = await analyze_reviews_with_llm(
        reviews,
        product_name=product.name,
        brand=product.brand,
    )
    analysis = validate_evidence(analysis, reviews)

    # Store analysis
    analysis_record = ReviewAnalysis(
        product_id=product_id,
        analysis_json=analysis.model_dump(),
        evidence_json=[e.model_dump() for e in analysis.evidence],
        review_count_at_analysis=len(reviews),
    )
    db.add(analysis_record)
    await db.flush()

    return {
        "status": "success",
        "analysis": analysis.model_dump(),
    }
