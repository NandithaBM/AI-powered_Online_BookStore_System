from pymongo import MongoClient
import json

client = MongoClient("mongodb://localhost:27017/")
db = client["books"]  # update if different
collection = db["books"]

def fetch_books():
    books = list(collection.find())
    print(f"✅ Loaded {len(books)} books from MongoDB.")
    return books

def transform_books(raw_books):
    transformed = []
    for book in raw_books:
        mongo_id = str(book.get("_id", ""))
        transformed.append({
            "_id": mongo_id,
            "id": mongo_id,
            "title": book.get("title", ""),
            "author": book.get("author", ""),
            "genre": ", ".join(book.get("genre", [])) if isinstance(book.get("genre"), list) else book.get("genre", ""),
            "description": book.get("description", ""),
            "coverImage": book.get("coverImage", ""),
            "price": book.get("price", 0.0)
        })
    return transformed

def save_to_json(data, path="books_meta.json"):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Saved to {path}")

if __name__ == "__main__":
    books = fetch_books()
    formatted = transform_books(books)
    save_to_json(formatted)
