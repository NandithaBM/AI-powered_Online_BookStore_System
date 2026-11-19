# 📚 AI-Powered Online BookStore

A full-stack online bookstore where users can browse books, add them to a cart, review them, and check out. It also includes an **AI-based hybrid recommendation system** and a **semantic search** module that help users discover books they are likely to enjoy.

I built this project on my own to practice full-stack development with **React, FastAPI, and MongoDB**. The system was also published as a research paper (see [Research Paper](#-research-paper)).

---

## ✨ Features

- Browse and search the book catalog
- Semantic search: find books by meaning, not just exact keywords
- User registration, login, and logout (sessions stay active until logout)
- Add to cart, update quantities, and remove items
- Checkout workflow
- Write and read book reviews
- AI-powered hybrid book recommendations based on user interaction history
- REST APIs tested using Postman

---

## 🛠️ Tech Stack

| Part | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI, Node.js |
| Database | MongoDB |
| AI / Search | Hybrid recommendation, semantic search |
| Tools | Git, GitHub, Postman, VS Code |

---

## 🤖 How the Recommendation Works

The recommendation module uses a **hybrid approach**, which combines:

1. **Content-based filtering**: suggests books similar to the ones a user has viewed or liked.
2. **Collaborative filtering**: suggests books that other users with similar interests liked.

Combining both gives more relevant suggestions than using either one alone.

---

## 📁 Project Structure

```
AI-powered_Online_BookStore_System/
├── src/               # React + TypeScript frontend (pages, components)
├── server/            # Backend APIs (authentication, books, cart, reviews)
├── semantic-search/   # Semantic search module
├── index.html         # Frontend entry point
├── package.json       # Frontend dependencies and scripts
├── vite.config.ts     # Vite configuration
└── tailwind.config.js # Tailwind CSS configuration
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed:

- Node.js and npm
- Python 3.9 or higher
- MongoDB (local installation or MongoDB Atlas)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/NandithaBM/AI-powered_Online_BookStore_System.git
cd AI-powered_Online_BookStore_System
```

### 2. Run the frontend

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

### 3. Run the backend

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend runs at `http://127.0.0.1:8000`.
FastAPI documentation is available at `http://127.0.0.1:8000/docs`.

> Check the file name (`main.py`) and the install step against your `server` folder, and change them if they are different.

### 4. Environment variables

Create a `.env` file in the `server` folder:

```
MONGODB_URI=your_mongodb_connection_string
SECRET_KEY=your_secret_key
```

> Never upload your real `.env` file to GitHub.

---

## 📸 Screenshots

Add screenshots of the home page, book details page, cart, and recommendations here.

```
![Home Page](screenshots/home.png)
![Recommendations](screenshots/recommendations.png)
```

---

## 📄 Research Paper

**AI-Powered Book Discovery: Integrating Semantic Search, Hybrid Recommendation, and Explainable AI in a Full-Stack Platform**
Published in the *International Journal for Multidisciplinary Research (IJFMR)*.
[Read the paper](PASTE_PAPER_LINK_HERE)

---

## 🔮 Future Improvements

- Add online payment integration
- Add an admin dashboard to manage books and orders
- Add automated tests with pytest
- Deploy the application online

---

## 👩‍💻 Author

**Nanditha B M**
MCA Graduate | Aspiring Software Engineer

- GitHub: [NandithaBM](https://github.com/NandithaBM)
- LinkedIn: [Add your LinkedIn link]
- Email: [Add your email]
