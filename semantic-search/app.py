from flask import Flask, request, jsonify
import faiss
import json
import numpy as np
import os

app = Flask(__name__)

# Load books data
BOOKS_FILE = 'books_meta.json'
EMBEDDINGS_FILE = 'embeddings.json'
FAISS_INDEX_FILE = 'faiss_index.bin'

if not os.path.exists(BOOKS_FILE):
    raise FileNotFoundError(f"{BOOKS_FILE} not found.")

if not os.path.exists(EMBEDDINGS_FILE):
    raise FileNotFoundError(f"{EMBEDDINGS_FILE} not found.")

if not os.path.exists(FAISS_INDEX_FILE):
    raise FileNotFoundError(f"{FAISS_INDEX_FILE} not found.")

with open(BOOKS_FILE, 'r', encoding='utf-8') as f:
    books = json.load(f)

with open(EMBEDDINGS_FILE, 'r', encoding='utf-8') as f:
    embeddings = json.load(f)

# Load FAISS index
try:
    index = faiss.read_index(FAISS_INDEX_FILE)
except Exception as e:
    raise RuntimeError(f"Failed to load FAISS index: {str(e)}")

# Search using FAISS
def cosine_search(query_vector, k=10):
    query_vector = np.array([query_vector], dtype='float32')
    distances, indices = index.search(query_vector, k)
    return indices[0], distances[0]

@app.route('/search', methods=['POST'])
def search():
    data = request.get_json()
    if not data or 'query_vector' not in data:
        return jsonify({"error": "Missing 'query_vector' in request body"}), 400

    query_vector = data["query_vector"]
    if not isinstance(query_vector, list) or not all(isinstance(x, (float, int)) for x in query_vector):
        return jsonify({"error": "'query_vector' must be a list of numbers"}), 400

    k = int(data.get("k", 10))
    idxs, scores = cosine_search(query_vector, k)

    results = []
    for i, score in zip(idxs, scores):
        if i < len(books):
            book = books[i].copy()
            book["score"] = float(score)
            results.append(book)

    return jsonify({"results": results})

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"message": "✅ Semantic Search Service is running"}), 200

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8000)
