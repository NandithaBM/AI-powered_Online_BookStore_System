# Generate embeddings from books_meta.json using SBERT
from sentence_transformers import SentenceTransformer
import json
import numpy as np
import faiss
import os

model = SentenceTransformer('all-MiniLM-L6-v2')

with open('books_meta.json', 'r', encoding='utf-8') as f:
    books = json.load(f)

texts = [f"{b['title']} {b['author']} {b['genre']} {b['description']}" for b in books]
embeddings = model.encode(texts, convert_to_numpy=True)

# Save embeddings
np.save('book_vectors.npy', embeddings)

# Save FAISS index
index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(embeddings)
faiss.write_index(index, 'book_faiss.index')

print(f"✅ Embedded {len(books)} books and saved index.")
