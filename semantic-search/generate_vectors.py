# semantic-search/generate_vectors.py

import json
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

model = SentenceTransformer('all-MiniLM-L6-v2')

with open("books_meta.json", "r", encoding="utf-8") as f:
    books = json.load(f)

# Combine title + description for embedding
texts = [
    f"{book.get('title', '')} {book.get('author', '')} {book.get('description', '')}"
    for book in books
]

print("🔁 Generating embeddings...")
embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=True)

# Save embeddings
with open("embeddings.json", "w", encoding="utf-8") as f:
    json.dump(embeddings.tolist(), f)

# Build FAISS index
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(embeddings)

faiss.write_index(index, "faiss_index.bin")
print("✅ Saved FAISS index and embeddings.")
