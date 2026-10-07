# Library Books REST API Design

Documentation for managing the `books` resource in a library system.

## Endpoints

### 1. List All Books
- **Method**: `GET`
- **Path**: `/books`
- **Description**: Retrieves a list of all books in the library catalog.
- **Request Body**: None
- **Success Status Code**: `200 OK`

### 2. Get Single Book
- **Method**: `GET`
- **Path**: `/books/:id`
- **Description**: Retrieves details of a specific book by its unique ID.
- **Request Body**: None
- **Success Status Code**: `200 OK`

### 3. Create Book
- **Method**: `POST`
- **Path**: `/books`
- **Description**: Adds a new book entry to the library catalog.
- **Request Body**:
  ```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "publishedYear": 1958,
    "genre": "Fiction"
  }
