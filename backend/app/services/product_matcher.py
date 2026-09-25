"""
Product matcher — ranks candidates and verifies product identity.

Scoring considers:
  - Title consistency across sources
  - Brand identification
  - Model number identification
  - Ratings/reviews presence
  - Multiple source agreement
"""

import re
import logging
from app.config import settings
from app.schemas.product import ProductCandidate, ProductMatch, MatchStatus

logger = logging.getLogger(__name__)

# Common brand patterns
BRAND_PATTERNS = [
    r"\b(Sony|Samsung|Apple|Bose|JBL|OnePlus|Xiaomi|Realme|Oppo|Vivo|"
    r"LG|Philips|Panasonic|Boat|Noise|Fire-Boltt|HP|Dell|Lenovo|Asus|"
    r"Acer|MSI|Canon|Nikon|Dyson|Bosch|Nike|Adidas|Puma|Logitech|"
    r"Corsair|Razer|HyperX|SteelSeries|Marshall|Sennheiser|"
    r"Audio-Technica|Skullcandy|Anker|Jabra|Nothing|Google|Microsoft|"
    r"Amazon|Kindle|Intel|AMD|Nvidia|WH-|Galaxy|iPhone|iPad|MacBook|"
    r"ThinkPad|Redmi|Poco|iQOO|Motorola|Nokia|Honor|Huawei|"
    r"Zebronics|Boult|Portronics|Mivi|pTron|Infinity|Cosmic Byte|Ant Esports|"
    r"Colgate|Dettol|Dove|Nivea|Pepsodent|Sensodyne|Oral-B|Garnier|L'Oreal|"
    r"Himalaya|Biotique|Mamaearth|Pond's|Vaseline|Parachute|Wild Stone|Fogg|Axe|"
    r"Park Avenue|Fastrack|Titan|Casio|Crocs|Skechers|Reebok|Woodland|Bata|Sparx|"
    r"Zara|Levis|Peter England|Van Heusen|Allen Solly)\b",
]

# Model number patterns
MODEL_PATTERNS = [
    r"([A-Z]{1,4}[-\s]?\d{2,5}[A-Z]{0,3}\d{0,3})",  # XM5, WH-1000XM5
    r"((?:Mark|MK)\s*[IVX\d]+)",  # Mark III, MK4
    r"(\d{1,2}(?:st|nd|rd|th)\s+[Gg]en(?:eration)?)",  # 5th Gen
    r"((?:Pro|Max|Plus|Ultra|Lite|Mini|Air|SE)\b)",  # Variant suffixes
]


def extract_brand(title: str) -> str:
    """Extract brand name from product title."""
    for pattern in BRAND_PATTERNS:
        match = re.search(pattern, title, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    # Fallback: first word if capitalized
    words = title.split()
    if words and words[0][0].isupper():
        return words[0]
    return ""


def extract_model(title: str) -> str:
    """Extract model number/name from product title."""
    for pattern in MODEL_PATTERNS:
        match = re.search(pattern, title)
        if match:
            return match.group(1).strip()
    return ""


def normalize_title(title: str) -> str:
    """Normalize title for comparison."""
    # Remove common noise words
    noise = ["buy", "online", "best", "price", "new", "original", "genuine",
             "sale", "offer", "discount", "free", "shipping", "delivery"]
    words = title.lower().split()
    return " ".join(w for w in words if w not in noise)


def compute_candidate_score(candidate: dict, all_candidates: list[dict]) -> float:
    """Score a candidate based on multiple signals."""
    score = 0.0
    title = candidate.get("title", "")

    # Brand identified → +0.20
    brand = extract_brand(title)
    if brand:
        score += 0.20
        candidate["_brand"] = brand

    # Model identified → +0.20
    model = extract_model(title)
    if model:
        score += 0.20
        candidate["_model"] = model

    # Has rating → +0.10
    if candidate.get("rating") is not None:
        score += 0.10

    # Has review count → +0.10
    if candidate.get("reviews") is not None and candidate.get("reviews", 0) > 0:
        score += 0.10

    # Title consistency: check if similar titles appear in other candidates → +0.25
    norm_title = normalize_title(title)
    title_words = set(norm_title.split())
    matching_titles = 0
    for other in all_candidates:
        if other is candidate:
            continue
        other_words = set(normalize_title(other.get("title", "")).split())
        overlap = len(title_words & other_words) / max(len(title_words | other_words), 1)
        if overlap > 0.5:
            matching_titles += 1
    if matching_titles >= 2:
        score += 0.25
    elif matching_titles >= 1:
        score += 0.15

    # Has price → +0.05
    if candidate.get("price") is not None:
        score += 0.05

    # In stock → +0.05
    if candidate.get("in_stock"):
        score += 0.05

    # Position bonus (earlier results are better) → up to +0.05
    pos = candidate.get("position", 10)
    score += max(0, 0.05 - pos * 0.005)

    return min(score, 1.0)


def rank_candidates(candidates: list[dict]) -> ProductMatch:
    """
    Rank product candidates and determine match status.

    Returns a ProductMatch with confidence and the best candidate.
    """
    if not candidates:
        return ProductMatch(
            match_status=MatchStatus.NOT_FOUND,
            confidence=0.0,
            candidate_count=0,
        )

    # Score each candidate
    scored = []
    for c in candidates:
        c["_score"] = compute_candidate_score(c, candidates)
        scored.append(c)

    # Sort by score descending
    scored.sort(key=lambda x: x["_score"], reverse=True)

    best = scored[0]
    confidence = best["_score"]

    # Build response candidates
    all_product_candidates = []
    for c in scored[:10]:  # top 10
        all_product_candidates.append(ProductCandidate(
            title=c.get("title", ""),
            source=c.get("source", ""),
            link=c.get("link", ""),
            rating=c.get("rating"),
            reviews=c.get("reviews"),
            price=str(c.get("price_display", c.get("price", ""))),
            thumbnail=c.get("thumbnail", ""),
            in_stock=c.get("in_stock"),
            position=c.get("position", 0),
            brand=c.get("_brand", extract_brand(c.get("title", ""))),
            model_name=c.get("_model", extract_model(c.get("title", ""))),
        ))

    # Determine match status
    if confidence >= settings.MATCH_CONFIDENCE_THRESHOLD:
        status = MatchStatus.MATCHED
    elif confidence >= settings.AMBIGUOUS_THRESHOLD:
        status = MatchStatus.AMBIGUOUS
    else:
        status = MatchStatus.NOT_FOUND

    best_candidate = all_product_candidates[0] if all_product_candidates else None

    return ProductMatch(
        match_status=status,
        confidence=round(confidence, 2),
        product_name=best.get("title", ""),
        brand=best.get("_brand", ""),
        model_name=best.get("_model", ""),
        category="",
        candidate_count=len(candidates),
        selected_candidate=best_candidate,
        all_candidates=all_product_candidates,
    )
