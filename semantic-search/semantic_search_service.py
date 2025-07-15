from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers.pipelines import pipeline
import copy

app = FastAPI()

# Enable CORS for your frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load books from JSON
with open("books_meta.json", "r", encoding="utf-8") as f:
    books = json.load(f)

# SBERT Model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Precompute embeddings
corpus = [f"{book['title']} {book['author']} {book['genre']} {book['description']}" for book in books]
corpus_embeddings = model.encode(corpus, convert_to_numpy=True, show_progress_bar=True)
corpus_embeddings = np.array(corpus_embeddings).astype(np.float32)

# Build FAISS index
dimension = corpus_embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(corpus_embeddings)  # type: ignore

# Sentiment analysis pipeline
sentiment_analyzer = pipeline("sentiment-analysis")

# Response models
class BookResult(BaseModel):
    id: str
    title: str
    author: str
    genre: str
    description: str
    coverImage: str
    price: float
    relevanceScore: float

class SentimentRequest(BaseModel):
    text: str

class SentimentResult(BaseModel):
    label: str
    score: float

class RecommendationResult(BaseModel):
    id: str
    title: str
    author: str
    genre: str
    description: str
    coverImage: str
    price: float
    relevanceScore: float
    explanation: str

class PersonalizedRecommendRequest(BaseModel):
    preferences: Optional[dict] = None
    wishlist: Optional[list] = None
    viewedBooks: Optional[list] = None

@app.get("/semantic-search", response_model=List[BookResult])
def semantic_search(query: str = Query(..., min_length=2), limit: int = 10):
    query_embedding = model.encode([query], convert_to_numpy=True)
    query_embedding = np.array(query_embedding).astype(np.float32)
    # Ensure query_embedding is 2D
    if query_embedding.ndim == 1:
        query_embedding = query_embedding.reshape(1, -1)
    scores, indices = index.search(query_embedding, limit)  # type: ignore

    results = []
    for score, idx in zip(scores[0], indices[0]):
        book = copy.deepcopy(books[idx])
        book["relevanceScore"] = float(1 / (1 + score))  # Convert L2 distance to pseudo score
        results.append(book)

    return results

@app.post("/sentiment", response_model=SentimentResult)
def analyze_sentiment(request: SentimentRequest):
    result = sentiment_analyzer(request.text)
    # result should be a list of dicts, but handle other types for robustness
    if isinstance(result, list) and len(result) > 0:
        item = result[0]
        label = item["label"] if isinstance(item, dict) and "label" in item else "ERROR"
        score = float(item["score"]) if isinstance(item, dict) and "score" in item else 0.0
        return {"label": label, "score": score}
    return {"label": "ERROR", "score": 0.0}

@app.get("/recommend", response_model=List[RecommendationResult])
def recommend(book_id: str, limit: int = 5):
    # Find the book by id
    book_idx = next((i for i, b in enumerate(books) if str(b.get('id')) == str(book_id)), None)
    if book_idx is None:
        raise HTTPException(status_code=404, detail="Book not found")
    # Get the embedding for this book
    book_embedding = corpus_embeddings[book_idx]
    book_embedding = np.array(book_embedding, dtype=np.float32)
    if book_embedding.ndim == 1:
        book_embedding = book_embedding.reshape(1, -1)
    book_embedding = np.ascontiguousarray(book_embedding, dtype=np.float32)
    print("book_embedding shape:", book_embedding.shape)
    print("book_embedding dtype:", book_embedding.dtype)
    print("index ntotal:", index.ntotal)
    print("limit + 1:", limit + 1)
    scores, indices = index.search(book_embedding, 1)  # type: ignore
    print(scores, indices)
    recommendations = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == book_idx:
            continue  # skip the original book
        rec_book = copy.deepcopy(books[idx])
        rec_book["relevanceScore"] = float(1 / (1 + score))
        # Explanation: same genre, author, or most similar description
        explanation = []
        if rec_book["genre"] == books[book_idx]["genre"]:
            explanation.append("Same genre")
        if rec_book["author"] == books[book_idx]["author"]:
            explanation.append("Same author")
        # If no direct match, fallback to similarity
        if not explanation:
            explanation.append("Similar description/content")
        rec_book["explanation"] = ", ".join(explanation)
        recommendations.append(rec_book)
        if len(recommendations) >= limit:
            break
    return recommendations

@app.post("/personalized-recommend", response_model=List[RecommendationResult])
def personalized_recommend(request: PersonalizedRecommendRequest = Body(...)):
    print('Received payload:', request.dict())
    # Gather genres/authors from preferences and viewed books
    genres = set()
    authors = set()
    exclude_ids = set()
    liked_book_title = None

    # From preferences
    if request.preferences:
        genres.update(request.preferences.get("genres", []))
        authors.update(request.preferences.get("authors", []))

    # From viewed books: find most recent or highest-rated book
    if request.viewedBooks:
        # Prefer highest-rated, then most recent
        sorted_viewed = sorted(
            [entry for entry in request.viewedBooks if entry.get("book")],
            key=lambda e: (e.get("rating", 0), e.get("dateViewed", "")),
            reverse=True
        )
        if sorted_viewed:
            liked_book = sorted_viewed[0]["book"]
            liked_book_title = liked_book.get("title")
        for entry in request.viewedBooks:
            book = entry.get("book")
            if book:
                genres.update(book.get("genre", []))
                author = book.get("author")
                if author:
                    authors.add(author)
                exclude_ids.add(str(book.get("_id")))

    # From wishlist
    if request.wishlist:
        for book in request.wishlist:
            genres.update(book.get("genre", []))
            author = book.get("author")
            if author:
                authors.add(author)
            exclude_ids.add(str(book.get("_id")))

    # Recommend books matching genres/authors, not in exclude_ids
    recommendations = []
    for book in books:
        if str(book.get("id")) in exclude_ids:
            continue
        explanation = []
        if genres and any(g in book.get("genre", []) for g in genres):
            explanation.append("Matches your preferred genre(s)")
        if authors and book.get("author") in authors:
            explanation.append("By an author you like")
        if not explanation:
            continue  # Only recommend if there's a match
        rec_book = copy.deepcopy(book)
        rec_book["relevanceScore"] = 1.0  # Placeholder, could use model
        # Add 'Because you liked...' or fallback explanation
        if liked_book_title:
            rec_book["explanation"] = f"Because you liked {liked_book_title}"
        else:
            rec_book["explanation"] = "Based on your preferences"
        recommendations.append(rec_book)
        if len(recommendations) >= 8:
            break
    print('Returning recommendations:', recommendations)
    return recommendations

# TODO: Add hybrid recommendation endpoint
# TODO: Add explainable AI endpoint

if __name__ == "__main__":
    uvicorn.run("semantic_search_service:app", host="0.0.0.0", port=8000, reload=True)
