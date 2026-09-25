# Reviewly 🛍️ — AI Product Review Intelligence & Price Comparison

> **Snap a Product. Know What Real Customers Say.**  
> An end-to-end AI platform combining visual product recognition, real-time multi-retailer pricing, and an evidence-grounded Natural Language Processing (NLP) intelligence engine.

🌐 **Live Web Application:** [https://productreview1-0.onrender.com](https://productreview1-0.onrender.com)  
📱 **Android Native App:** [Reviewly.apk](file:///d:/varu_project/Reviewly.apk) (9.1 MB debug build)  
📖 **Deep Architecture & NLP Guide:** [ARCHITECTURE_AND_NLP_WORKFLOW.md](file:///d:/varu_project/ARCHITECTURE_AND_NLP_WORKFLOW.md)

---

## 🚀 Key Highlights & Capabilities

- **Visual Product Search:** Upload any product photo (or query) to automatically extract brand, model, and category using Google Lens.
- **Evidence-Based NLP Review Engine:**
  - **Aspect-Based Sentiment Analysis (ABSA):** Evaluates products across 6 real-world dimensions: *Build Quality, Value for Money, Performance & Speed, Comfort & Ergonomics, Battery Endurance, and Delivery/Packaging*.
  - **Review Authenticity & Credibility Index (0–100%):** Evaluates verified purchase ratios, Type-Token Ratio (TTR) lexical variety, and sentiment-rating harmony to flag spam/bot reviews.
  - **Valence-Aware Sentiment Scoring:** Dynamic 3-token negation scope (`not good` $\rightarrow$ negative) and intensifier multipliers (`very fast` $\rightarrow +1.4\times$).
  - **Customer Emotion Profiling:** Measures community distribution across *Delight, Satisfaction, Neutrality, and Frustration*.
  - **Zero-Hallucination Policy:** Every generated claim cites exact review IDs with authentic customer quotes.
- **Multi-Store Price Intelligence:** Live price and stock scraping across Amazon, Flipkart, eBay, Croma, and Google Shopping.
- **Unified Single-Service Cloud Deployment:** Serves both the compiled React 19 SPA and FastAPI backend from a single Render deployment.
- **Cross-Platform:** Available as both a modern glassmorphic web application and a native Android APK via Capacitor 8.5.

---

## 🧠 NLP Workflow at a Glance

```
[Raw Customer Reviews]
        │
        ▼
[1. Text Preprocessing & Cleaning]
        │
        ▼
[2. Sentence Tokenization & Negation Windowing (3-token scope)]
        │
        ▼
[3. Valence Sentiment Scoring via Tanh Normalization]
        │
        ├──────────────────────┬──────────────────────┬──────────────────────┐
        ▼                      ▼                      ▼                      ▼
[4. Aspect-Based ABSA]  [5. Credibility Index] [6. N-Gram Extraction] [7. Emotion Profile]
(6 Core Dimensions)     (Verified Ratio + TTR) (Bigrams & Trigrams)   (Delight vs Frustrated)
        │                      │                      │                      │
        └──────────────────────┴──────────────────────┴──────────────────────┘
                               │
                               ▼
        [8. Multi-LLM / Deterministic Evidence Synthesis Engine]
                               │
                               ▼
     [Direct Quote Attribution & Review ID Citations (Zero Hallucination)]
```

*For complete mathematical formulas, schema definitions, and Mermaid diagrams, read [ARCHITECTURE_AND_NLP_WORKFLOW.md](file:///d:/varu_project/ARCHITECTURE_AND_NLP_WORKFLOW.md).*

---

## 📁 Project Structure

```
varu_project/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI Routers (auth, upload, products, reviews, analysis)
│   │   ├── models/          # SQLAlchemy async ORM models (User, Product, Review, etc.)
│   │   ├── schemas/         # Pydantic schemas for data validation
│   │   ├── services/
│   │   │   ├── nlp_engine.py      # Core NLP engine (ABSA, credibility, n-grams, emotions)
│   │   │   ├── llm_analysis.py    # Multi-provider LLM & deterministic evidence engine
│   │   │   ├── review_service.py  # Review scraper & normalization
│   │   │   ├── image_search.py    # Google Lens visual search
│   │   │   └── product_service.py # Database operations & caching
│   │   ├── config.py        # Environment settings & secrets
│   │   ├── database.py      # Async SQLite setup (reviewai.db via aiosqlite)
│   │   └── main.py          # FastAPI application & SPA static file server
│   ├── requirements.txt     # Python backend dependencies
│   └── dist/                # Embedded production React build
├── frontend/
│   ├── src/
│   │   ├── components/      # ProcessingPipeline, PriceComparison, ProductHero, etc.
│   │   ├── pages/           # AuthPage, ResultsPage, LandingPage
│   │   ├── utils/           # api.js, auth.js
│   │   └── App.jsx          # Main application router
│   ├── android/             # Capacitor Android native wrapper
│   └── package.json         # React 19 & Vite dependencies
├── ARCHITECTURE_AND_NLP_WORKFLOW.md # Full architecture & technical presentation script
├── Reviewly.apk             # Compiled and signed Android debug APK
├── build.sh                 # Cloud build script for Render
├── build_apk.ps1            # Automated Android APK packaging & signing script
├── render.yaml              # Render single-service infrastructure as code
└── README.md                # Project documentation
```

---

## 🛠️ Local Development

### 1. Backend Setup

```bash
cd backend

# Create & activate Python virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

### 3. Build Android APK

```powershell
# Run from repository root:
powershell -ExecutionPolicy Bypass -File .\build_apk.ps1
```
The newly compiled and signed APK will be output to `./Reviewly.apk`.

---

## 📄 License
This project is licensed under the MIT License.
