"""Pydantic schemas for LLM analysis results."""

from pydantic import BaseModel


class EvidenceItem(BaseModel):
    """A single claim backed by review evidence."""
    claim: str
    supporting_review_ids: list[str] = []
    supporting_excerpts: list[str] = []  # short snippets from reviews


class ThemeItem(BaseModel):
    """A theme extracted from reviews."""
    theme: str
    mention_count: int = 0
    sentiment: str = "neutral"  # positive, negative, neutral
    evidence: list[EvidenceItem] = []


class SentimentDistribution(BaseModel):
    """Distribution of review sentiments."""
    positive: int = 0
    neutral: int = 0
    negative: int = 0


class ConflictingOpinion(BaseModel):
    """When reviewers disagree on a topic."""
    topic: str
    positive_view: str = ""
    negative_view: str = ""
    positive_review_ids: list[str] = []
    negative_review_ids: list[str] = []


class AspectScore(BaseModel):
    """Aspect-based sentiment analysis score."""
    aspect: str
    score: float = 0.0          # -1.0 to 1.0
    rating: float = 0.0         # 1.0 to 5.0
    mention_count: int = 0
    sentiment: str = "neutral"  # positive, neutral, negative
    positive_phrases: list[str] = []
    negative_phrases: list[str] = []
    top_quote: str = ""


class ReviewCredibility(BaseModel):
    """Credibility index of reviews (authenticity vs spam/bot patterns)."""
    authenticity_score: int = 85        # 0 to 100%
    verified_ratio: float = 0.0         # 0.0 to 1.0
    credibility_grade: str = "High"
    flagged_patterns: list[str] = []
    sample_size: int = 0


class NlpInsights(BaseModel):
    """Deep NLP engine insights."""
    aspect_scores: list[AspectScore] = []
    credibility: ReviewCredibility = ReviewCredibility()
    dominant_emotions: list[dict] = []
    top_keywords_positive: list[str] = []
    top_keywords_negative: list[str] = []


class AnalysisResult(BaseModel):
    """Full LLM analysis output — evidence-based only."""
    product_summary: str = ""  # 4 to 5 lines evidence-based summary synthesized from real reviews
    overall_sentiment: str = "neutral"
    sentiment_distribution: SentimentDistribution = SentimentDistribution()
    positive_themes: list[ThemeItem] = []
    negative_themes: list[ThemeItem] = []
    common_problems: list[str] = []
    commonly_praised_features: list[str] = []
    review_consensus: str = "insufficient_evidence"  # strong_consensus, moderate_consensus, mixed_opinions, insufficient_evidence
    conflicting_opinions: list[ConflictingOpinion] = []
    best_for: list[str] = []
    potential_concerns: list[str] = []
    evidence: list[EvidenceItem] = []
    review_count_analyzed: int = 0
    data_quality_note: str = ""
    nlp_insights: NlpInsights | None = None


class FullReportResponse(BaseModel):
    """Complete analysis report returned to the frontend."""
    product: dict = {}
    match: dict = {}
    sources: list[dict] = []
    reviews: dict = {}
    analysis: dict = {}
    prices: list[dict] = []
    metadata: dict = {}
