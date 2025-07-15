# Convert a query string to vector
from sentence_transformers import SentenceTransformer
import sys
import json

model = SentenceTransformer('all-MiniLM-L6-v2')

query = ' '.join(sys.argv[1:])
vector = model.encode([query])[0]
print(json.dumps(vector.tolist()))
