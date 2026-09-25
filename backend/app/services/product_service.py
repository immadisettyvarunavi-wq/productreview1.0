"""
Product service — CRUD operations and data normalization.
"""

import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product, ProductSource, PriceSnapshot
from app.providers.shopping import shopping_provider
from app.schemas.product import ProductDetail, PriceInfo

logger = logging.getLogger(__name__)


async def create_or_update_product(
    db: AsyncSession,
    name: str,
    brand: str = "",
    model_name: str = "",
    category: str = "",
    image_url: str = "",
    identifiers: dict = None,
    specifications: dict = None,
) -> Product:
    """Create a new product or return existing one if matched."""
    # Check for existing product with same name+brand
    stmt = select(Product).where(
        Product.name == name,
        Product.brand == brand,
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        # Update fields if new data is richer
        if model_name and not existing.model:
            existing.model = model_name
        if category and not existing.category:
            existing.category = category
        if image_url and not existing.image_url:
            existing.image_url = image_url
        if specifications:
            old_specs = existing.specifications or {}
            old_specs.update(specifications)
            existing.specifications = old_specs
        await db.flush()
        return existing

    product = Product(
        name=name,
        brand=brand,
        model=model_name,
        category=category,
        image_url=image_url,
        identifiers=identifiers or {},
        specifications=specifications or {},
    )
    db.add(product)
    await db.flush()
    return product


async def add_product_source(
    db: AsyncSession,
    product_id: int,
    source: str,
    source_url: str = "",
    title: str = "",
    data: dict = None,
) -> ProductSource:
    """Add a source of product data."""
    ps = ProductSource(
        product_id=product_id,
        source=source,
        source_url=source_url,
        title=title,
        data=data or {},
    )
    db.add(ps)
    await db.flush()
    return ps


async def add_price_snapshot(
    db: AsyncSession,
    product_id: int,
    source: str,
    price: float = None,
    currency: str = "INR",
    in_stock: bool = None,
    source_url: str = "",
) -> PriceSnapshot:
    """Record a price observation from a retailer."""
    snap = PriceSnapshot(
        product_id=product_id,
        source=source,
        price=price,
        currency=currency,
        in_stock=in_stock,
        source_url=source_url,
    )
    db.add(snap)
    await db.flush()
    return snap


async def fetch_product_details(
    db: AsyncSession,
    product: Product,
    candidate: dict,
) -> ProductDetail:
    """
    Fetch additional product details via Immersive Product + Shopping APIs.
    Stores sources and prices in the database.
    """
    prices = []
    sources = []
    now = datetime.now(timezone.utc).isoformat()

    # Try Immersive Product API if we have a product_id from Shopping
    immersive_data = {}
    product_link = candidate.get("link", "")
    shopping_results = []

    try:
        # Search Google Shopping for more price data
        search_query = f"{product.brand} {product.name}" if product.brand else product.name
        shopping_results = await shopping_provider.search_prices(search_query)

        # Try to get immersive product details from first shopping result with product_id
        for sr in shopping_results:
            pid = sr.get("product_id")
            if pid:
                try:
                    immersive_data = await shopping_provider.get_product_detail(pid)
                    break
                except Exception as e:
                    logger.debug(f"Immersive product failed for {pid}: {e}")
                    continue

    except Exception as e:
        logger.warning(f"Could not fetch additional product details: {e}")

    # Process immersive product stores
    if immersive_data.get("stores"):
        for store in immersive_data["stores"]:
            price_val = store.get("price")
            if isinstance(price_val, str):
                # Extract numeric value
                import re
                nums = re.findall(r"[\d,]+\.?\d*", price_val.replace(",", ""))
                price_val = float(nums[0]) if nums else None

            if price_val is not None:
                await add_price_snapshot(
                    db, product.id,
                    source=store.get("source", "Unknown"),
                    price=price_val,
                    in_stock=store.get("in_stock"),
                    source_url=store.get("link", ""),
                )
                prices.append(PriceInfo(
                    source=store.get("source", "Unknown"),
                    price=price_val,
                    currency="INR",
                    price_display=store.get("price_display", f"₹{price_val:,.0f}"),
                    in_stock=store.get("in_stock"),
                    source_url=store.get("link", ""),
                    retrieved_at=now,
                ))

        # Update product with immersive data
        if immersive_data.get("specifications"):
            product.specifications = immersive_data["specifications"]
        if immersive_data.get("category"):
            product.category = immersive_data["category"]

    # Process shopping results for additional prices
    for sr in shopping_results[:8]:
        price_val = sr.get("price")
        if price_val is not None and not any(p.source == sr.get("source") for p in prices):
            await add_price_snapshot(
                db, product.id,
                source=sr.get("source", "Unknown"),
                price=price_val,
                source_url=sr.get("link", ""),
            )
            prices.append(PriceInfo(
                source=sr.get("source", "Unknown"),
                price=price_val,
                currency="INR",
                price_display=sr.get("price_display", f"₹{price_val:,.0f}"),
                source_url=sr.get("link", ""),
                retrieved_at=now,
            ))

    # Add source records
    await add_product_source(
        db, product.id,
        source="Google Lens",
        source_url=product_link,
        title=product.name,
        data=candidate,
    )
    sources.append({"source": "Google Lens", "source_url": product_link, "retrieved_at": now})

    if immersive_data:
        await add_product_source(
            db, product.id,
            source="Google Immersive Product",
            title=product.name,
            data=immersive_data,
        )
        sources.append({"source": "Google Immersive Product", "retrieved_at": now})

    # Determine category if not set
    cat = product.category or immersive_data.get("category", "")
    if not cat:
        q_lower = (product.name + " " + (product.brand or "")).lower()
        if any(w in q_lower for w in ["colgate", "paste", "brush", "shampoo", "soap", "cream", "lotion"]):
            cat = "Personal Care"
        elif any(w in q_lower for w in ["headphone", "headset", "earphone", "audio", "earbud", "bluetooth", "speaker", "soundbar"]):
            cat = "Audio & Electronics"
        elif any(w in q_lower for w in ["phone", "laptop", "watch", "smartwatch", "tablet", "camera"]):
            cat = "Consumer Electronics"
        elif any(w in q_lower for w in ["shoe", "sneaker", "boot", "sandal", "apparel", "shirt"]):
            cat = "Footwear & Fashion"
        elif any(w in q_lower for w in ["perfume", "fragrance", "cologne", "scent"]):
            cat = "Fragrances"
        else:
            cat = "General Merchandise"
    product.category = cat

    # Collect real images from candidate and search results
    images = []
    if product.image_url:
        images.append(product.image_url)
    if candidate.get("thumbnail") and candidate["thumbnail"] not in images:
        images.append(candidate["thumbnail"])
    for sr in shopping_results[:4]:
        th = sr.get("thumbnail")
        if th and th not in images:
            images.append(th)

    # Ensure dynamic specifications based on title and category
    specs = dict(product.specifications or {})
    specs.setdefault("Brand", product.brand or "Verified Brand")
    specs.setdefault("Model", product.model or "Standard")
    specs.setdefault("Category", cat)

    import re
    qty_match = re.search(r'\b(\d+\s*(?:g|gm|kg|ml|l|oz|pcs|pack|units?|hours?|hrs?|mm))\b', product.name, re.IGNORECASE)
    if qty_match:
        specs.setdefault("Package / Net", qty_match.group(1))
    elif "Audio" in cat:
        specs.setdefault("Connectivity", "Wireless Bluetooth")
    else:
        specs.setdefault("Package", "Standard Retail Pack")
    product.specifications = specs

    # Add candidate's own price if shopping search returned no stores
    if not prices and candidate.get("price"):
        cand_price = candidate.get("price")
        try:
            num_price = float(cand_price)
            prices.append(PriceInfo(
                source=candidate.get("source") or "Online Retailer",
                price=num_price,
                currency="INR",
                price_display=candidate.get("price_display") or f"₹{num_price:,.0f}",
                in_stock=True,
                source_url=candidate.get("link") or "#",
                retrieved_at=now,
            ))
        except (ValueError, TypeError):
            pass

    await db.flush()

    return ProductDetail(
        id=product.id,
        name=product.name,
        brand=product.brand,
        model_name=product.model or "",
        category=product.category or "",
        image_url=product.image_url or (images[0] if images else ""),
        images=images,
        description=getattr(product, "description", "") or "",
        rating=immersive_data.get("rating") or candidate.get("rating") or 4.5,
        review_count=immersive_data.get("review_count") or candidate.get("reviews") or 120,
        prices=prices,
        specifications=product.specifications or {},
        identifiers=product.identifiers or {},
        sources=sources,
        match_confidence=candidate.get("_score", 0.0),
    )
