"""Pydantic schemas for review data."""

from pydantic import BaseModel
from typing import Optional


class ReviewItem(BaseModel):
    """A normalized customer review."""
    review_id: str = ""
    source: str = ""
    source_url: str = ""
    rating: Optional[float] = None
    title: str = ""
    content: str = ""
    date: str = ""
    verified_purchase: Optional[bool] = None
    helpful_votes: Optional[int] = None
    product_variant: str = ""
    language: str = "en"


class ReviewSourceSummary(BaseModel):
    """Aggregate stats from a single review source."""
    name: str
    rating: Optional[float] = None
    review_count: int = 0
    star_distribution: dict = {}  # {"5": 60, "4": 20, "3": 10, "2": 5, "1": 5}
    source_url: str = ""


class ReviewAggregation(BaseModel):
    """Multi-source review aggregation."""
    total_reviews: int = 0
    weighted_rating: Optional[float] = None
    sources: list[ReviewSourceSummary] = []
    star_distribution: dict = {}  # combined
    reviews: list[ReviewItem] = []


class ReviewDataResponse(BaseModel):
    """Full review data for a product."""
    product_id: int
    aggregation: ReviewAggregation
    reviews: list[ReviewItem] = []
