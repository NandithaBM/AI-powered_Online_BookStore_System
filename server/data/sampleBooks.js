export const sampleBooks = [
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    description: "A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream through the eyes of narrator Nick Carraway and his mysterious neighbor Jay Gatsby.",
    genre: ["Fiction", "Classic Literature", "American Literature"],
    language: "English",
    publisher: "Scribner",
    publishedDate: new Date("1925-04-10"),
    pageCount: 180,
    format: "paperback",
    price: 12.99,
    originalPrice: 15.99,
    discount: 19,
    coverImage: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg",
    inventory: {
      stock: 50,
      sold: 125
    },
    ratings: {
      average: 4.2,
      count: 1250
    },
    isActive: true,
    isFeatured: true,
    isBestseller: true,
    tags: ["classic", "american-dream", "jazz-age"],
    metadata: {
      keywords: ["gatsby", "american dream", "jazz age", "classic"],
      themes: ["wealth", "love", "social class", "moral decay"]
    }
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780061120084",
    description: "A gripping tale of racial injustice and childhood innocence in the American South, told through the eyes of Scout Finch as her father defends a black man falsely accused of rape.",
    genre: ["Fiction", "Classic Literature", "Historical Fiction"],
    language: "English",
    publisher: "J.B. Lippincott & Co.",
    publishedDate: new Date("1960-07-11"),
    pageCount: 376,
    format: "hardcover",
    price: 18.99,
    coverImage: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg",
    inventory: {
      stock: 35,
      sold: 200
    },
    ratings: {
      average: 4.5,
      count: 2100
    },
    isActive: true,
    isFeatured: true,
    isBestseller: true,
    tags: ["classic", "social-justice", "coming-of-age"],
    metadata: {
      keywords: ["mockingbird", "racial justice", "childhood", "moral courage"],
      themes: ["racism", "justice", "moral growth", "innocence"]
    }
  },
  {
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    description: "A dystopian masterpiece about totalitarian control, surveillance, and the power of language. Winston Smith struggles against Big Brother in a world where truth is malleable.",
    genre: ["Fiction", "Dystopian", "Science Fiction", "Political Fiction"],
    language: "English",
    publisher: "Secker & Warburg",
    publishedDate: new Date("1949-06-08"),
    pageCount: 328,
    format: "paperback",
    price: 13.99,
    originalPrice: 16.99,
    discount: 18,
    coverImage: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg",
    inventory: {
      stock: 75,
      sold: 300
    },
    ratings: {
      average: 4.4,
      count: 3500
    },
    isActive: true,
    isFeatured: true,
    isBestseller: true,
    tags: ["dystopian", "surveillance", "totalitarian"],
    metadata: {
      keywords: ["big brother", "surveillance", "dystopia", "totalitarian"],
      themes: ["government control", "surveillance", "truth", "freedom"]
    }
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    description: "A witty and romantic novel about Elizabeth Bennet and Mr. Darcy, exploring themes of love, marriage, and social class in Regency England.",
    genre: ["Fiction", "Romance", "Classic Literature"],
    language: "English",
    publisher: "T. Egerton",
    publishedDate: new Date("1813-01-28"),
    pageCount: 432,
    format: "paperback",
    price: 11.99,
    coverImage: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg",
    inventory: {
      stock: 60,
      sold: 180
    },
    ratings: {
      average: 4.3,
      count: 1800
    },
    isActive: true,
    isFeatured: true,
    tags: ["romance", "regency", "social-class"],
    metadata: {
      keywords: ["elizabeth bennet", "mr darcy", "romance", "regency"],
      themes: ["love", "marriage", "social class", "first impressions"]
    }
  },
  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    isbn: "9780316769174",
    description: "A controversial coming-of-age story following Holden Caulfield's journey through New York City after being expelled from prep school.",
    genre: ["Fiction", "Coming-of-age", "Classic Literature"],
    language: "English",
    publisher: "Little, Brown and Company",
    publishedDate: new Date("1951-07-16"),
    pageCount: 277,
    format: "hardcover",
    price: 16.99,
    coverImage: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg",
    inventory: {
      stock: 40,
      sold: 150
    },
    ratings: {
      average: 3.8,
      count: 2200
    },
    isActive: true,
    tags: ["coming-of-age", "rebellion", "adolescence"],
    metadata: {
      keywords: ["holden caulfield", "coming of age", "rebellion", "adolescence"],
      themes: ["alienation", "identity", "growing up", "phoniness"]
    }
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    isbn: "9780441172719",
    description: "An epic science fiction novel set on the desert planet Arrakis, following Paul Atreides as he navigates political intrigue and mystical powers.",
    genre: ["Science Fiction", "Fantasy", "Adventure"],
    language: "English",
    publisher: "Chilton Books",
    publishedDate: new Date("1965-08-01"),
    pageCount: 688,
    format: "paperback",
    price: 19.99,
    originalPrice: 24.99,
    discount: 20,
    coverImage: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg",
    inventory: {
      stock: 45,
      sold: 220
    },
    ratings: {
      average: 4.6,
      count: 2800
    },
    isActive: true,
    isFeatured: true,
    isBestseller: true,
    isNewRelease: false,
    tags: ["space-opera", "desert-planet", "political-intrigue"],
    metadata: {
      keywords: ["arrakis", "spice", "paul atreides", "space opera"],
      themes: ["power", "ecology", "religion", "politics"]
    }
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    description: "A charming fantasy adventure following Bilbo Baggins on his unexpected journey with dwarves to reclaim their homeland from the dragon Smaug.",
    genre: ["Fantasy", "Adventure", "Children's Literature"],
    language: "English",
    publisher: "George Allen & Unwin",
    publishedDate: new Date("1937-09-21"),
    pageCount: 310,
    format: "hardcover",
    price: 17.99,
    coverImage: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg",
    inventory: {
      stock: 55,
      sold: 280
    },
    ratings: {
      average: 4.7,
      count: 3200
    },
    isActive: true,
    isFeatured: true,
    isBestseller: true,
    tags: ["fantasy", "adventure", "middle-earth"],
    metadata: {
      keywords: ["bilbo baggins", "middle earth", "dragon", "adventure"],
      themes: ["heroism", "friendship", "home", "courage"]
    }
  },
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    isbn: "9780525559474",
    description: "A thought-provoking novel about life's infinite possibilities, following Nora Seed as she explores alternate versions of her life in a magical library.",
    genre: ["Fiction", "Contemporary Fiction", "Philosophy"],
    language: "English",
    publisher: "Viking",
    publishedDate: new Date("2020-08-13"),
    pageCount: 288,
    format: "paperback",
    price: 14.99,
    coverImage: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg",
    inventory: {
      stock: 70,
      sold: 95
    },
    ratings: {
      average: 4.1,
      count: 850
    },
    isActive: true,
    isNewRelease: true,
    tags: ["contemporary", "philosophical", "life-choices"],
    metadata: {
      keywords: ["parallel lives", "regret", "possibilities", "library"],
      themes: ["regret", "possibility", "self-discovery", "meaning of life"]
    }
  },
  {
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    isbn: "9780735219090",
    description: "A mystery and coming-of-age story set in the marshlands of North Carolina, following Kya Clark, the 'Marsh Girl,' as she grows up isolated from society.",
    genre: ["Fiction", "Mystery", "Coming-of-age"],
    language: "English",
    publisher: "G.P. Putnam's Sons",
    publishedDate: new Date("2018-08-14"),
    pageCount: 384,
    format: "paperback",
    price: 15.99,
    originalPrice: 18.99,
    discount: 16,
    coverImage: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg",
    inventory: {
      stock: 65,
      sold: 320
    },
    ratings: {
      average: 4.4,
      count: 2600
    },
    isActive: true,
    isBestseller: true,
    tags: ["mystery", "nature", "isolation"],
    metadata: {
      keywords: ["marsh girl", "nature", "mystery", "coming of age"],
      themes: ["isolation", "nature", "survival", "prejudice"]
    }
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    isbn: "9780735211292",
    description: "A practical guide to building good habits and breaking bad ones, offering proven strategies for creating lasting behavioral change.",
    genre: ["Self-Help", "Psychology", "Personal Development"],
    language: "English",
    publisher: "Avery",
    publishedDate: new Date("2018-10-16"),
    pageCount: 320,
    format: "hardcover",
    price: 21.99,
    originalPrice: 26.99,
    discount: 19,
    coverImage: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg",
    inventory: {
      stock: 80,
      sold: 450
    },
    ratings: {
      average: 4.8,
      count: 4200
    },
    isActive: true,
    isFeatured: true,
    isBestseller: true,
    tags: ["habits", "productivity", "self-improvement"],
    metadata: {
      keywords: ["habits", "behavior change", "productivity", "self improvement"],
      themes: ["habit formation", "personal growth", "behavior change", "success"]
    }
  }
];