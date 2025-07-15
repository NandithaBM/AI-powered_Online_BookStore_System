# Return top-N search matches for query vector
import faiss
import numpy as np
import json
import sys

vector_file = 'book_vectors.npy'
index_file = 'book_faiss.index'
book_file = 'books_meta.json'

# Load
vectors = np.load(vector_file)
index = faiss.read_index(index_file)

with open(book_file, 'r', encoding='utf-8') as f:
    books = json.load(f)

# Parse input vector
query_vector = np.array(json.loads(sys.stdin.read()), dtype='float32').reshape(1, -1)
top_k = int(sys.argv[1]) if len(sys.argv) > 1 else 10

# Search
D, I = index.search(query_vector, top_k)

results = []
for i in I[0]:
    if 0 <= i < len(books):
        results.append(books[i])

print(json.dumps(results, ensure_ascii=False))
