import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import chromadb
from openai import OpenAI
import uvicorn
from playwright.sync_api import sync_playwright

def scrape_url_sync(url: str) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, timeout=30000)
        text = page.evaluate("() => document.body.innerText")
        browser.close()
        return text

# Load environment variables from the local .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

API_KEY = os.getenv("OPENAI_API_KEY")
if not API_KEY:
    print("WARNING: OPENAI_API_KEY not found in .env.local")

# Initialize OpenAI client
client = OpenAI(api_key=API_KEY) if API_KEY else None

# Initialize ChromaDB client (persistent)
CHROMA_DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)

# Get or create collection
collection = chroma_client.get_or_create_collection(
    name="semantic_summaries",
    metadata={"hnsw:space": "l2"}
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Application startup
    yield
    # Application shutdown

app = FastAPI(title="Semantic Deduper Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods including OPTIONS
    allow_headers=["*"], # Allows all headers
)

class ArticlePayload(BaseModel):
    url: str
    raw_text: str | None = None

class ProcessIdeaResponse(BaseModel):
    status: str
    message: str | None = None
    reason: str | None = None
    distance: float | None = None
    content_to_use: str | None = None

@app.post("/process-idea", response_model=ProcessIdeaResponse)
async def process_idea(payload: ArticlePayload):
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI client not initialized (missing API key)")

    # Step 1: Text Extraction & Validation
    extracted_text = ""
    raw_text = payload.raw_text.strip() if payload.raw_text else ""
    
    if raw_text and not raw_text.startswith("http"):
        extracted_text = raw_text
    else:
        try:
            extracted_text = await run_in_threadpool(scrape_url_sync, payload.url)
            extracted_text = extracted_text.strip() if extracted_text else ""
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to scrape URL: {str(e)}")

    if not extracted_text or not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    # Step 2: Summarize FIRST (The Clean-Up)
    words = extracted_text.split()
    word_count = len(words)
    processed_text = extracted_text
    
    if word_count > 1000:
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert summarizer. Summarize this article content, focusing strictly on the core facts and ideas. Ignore any website navigation menus, ads, or footers."},
                    {"role": "user", "content": extracted_text}
                ],
                temperature=0.3,
                max_tokens=1500,
            )
            processed_text = response.choices[0].message.content.strip()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")

    # Step 3: Deduplicate (Apples to Apples)
    distance = None
    try:
        query_results = collection.query(
            query_texts=[processed_text],
            n_results=1
        )
        if query_results and "distances" in query_results and query_results["distances"] and len(query_results["distances"][0]) > 0:
            distance = query_results["distances"][0][0]
            if distance < 0.8:
                return ProcessIdeaResponse(
                    status="rejected",
                    reason="duplicate",
                    distance=distance
                )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ChromaDB error during deduplication: {str(e)}")

    # Step 4: Store and Return
    try:
        collection.add(
            documents=[processed_text],
            metadatas=[{"url": payload.url, "word_count": word_count}],
            ids=[payload.url]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ChromaDB error during storage: {str(e)}")

    return ProcessIdeaResponse(
        status="accepted",
        content_to_use=processed_text
    )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
