"""Pydantic schemas for product-related request/response data."""

from pydantic import BaseModel, ConfigDict
from typing import Optional
from enum import Enum


class MatchStatus(str, Enum):
    MATCHED = "matched"
    AMBIGUOUS = "ambiguous"
    NOT_FOUND = "not_found"
    VERIFICATION_FAILED = "verification_failed"


class ProductCandidate(BaseModel):
    """A single product candidate from visual search."""
    model_config = ConfigDict(protected_namespaces=())

    title: str = ""
    source: str = ""
    link: str = ""
    rating: Optional[float] = None
    reviews: Optional[int] = None
    price: Optional[str] = None
    thumbnail: str = ""
    in_stock: Optional[bool] = None
    position: int = 0
    brand: str = ""
    model_name: str = ""


class ProductMatch(BaseModel):
    """Result of the product matching/verification process."""
    model_config = ConfigDict(protected_namespaces=())

    match_status: MatchStatus
    confidence: float = 0.0
    product_name: str = ""
    brand: str = ""
    model_name: str = ""
    category: str = ""
    candidate_count: int = 0
    selected_candidate: Optional[ProductCandidate] = None
    all_candidates: list[ProductCandidate] = []


class PriceInfo(BaseModel):
    """Price from a specific retailer."""
    source: str
    price: Optional[float] = None
    currency: str = "INR"
    price_display: str = ""
    in_stock: Optional[bool] = None
    source_url: str = ""
    retrieved_at: str = ""


class ProductDetail(BaseModel):
    """Full product information with source attribution."""
    model_config = ConfigDict(protected_namespaces=())

    id: Optional[int] = None
    name: str = ""
    brand: str = ""
    model_name: str = ""
    category: str = ""
    image_url: str = ""
    images: list[str] = []
    description: str = ""
    rating: Optional[float] = None
    review_count: Optional[int] = None
    prices: list[PriceInfo] = []
    specifications: dict = {}
    identifiers: dict = {}
    sources: list[dict] = []
    match_confidence: float = 0.0


class ProductSearchResponse(BaseModel):
    """Response to a product search request."""
    match: ProductMatch
    product: Optional[ProductDetail] = None


class SourceInfo(BaseModel):
    """Source attribution metadata."""
    source: str
    source_url: str = ""
    retrieved_at: str = ""
