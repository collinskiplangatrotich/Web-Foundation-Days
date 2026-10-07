Library Books REST API Design
​Documentation for managing the books resource in a library system.
​Endpoints
​1. List All Books
​Method: GET
​Path: /books
​Description: Retrieves a list of all books in the library catalog.
​Request Body: None
​Success Status Code: 200 OK
​2. Get Single Book
​Method: GET
​Path: /books/:id
​Description: Retrieves details of a specific book by its unique ID.
​Request Body: None
​Success Status Code: 200 OK
​3. Create Book
​Method: POST
​Path: /books
​Description: Adds a new book entry to the library catalog.
​Request Body:
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958,
  "genre": "Fiction"
}
Success Status Code: 201 Created
4. Update Book
Method: PUT
Path: /books/:id
Description: Replaces all details of an existing book specified by its ID.
Request Body:
{
  "title": "Things Fall Apart (Revised Edition)",
  "author": "Chinua Achebe",
  "publishedYear": 1958,
  "genre": "Classic Fiction"
}
Success Status Code: 200 OK
5. Delete Book
Method: DELETE
Path: /books/:id
Description: Removes a specific book from the library catalog by its ID.
Request Body: None
Success Status Code: 204 No Content
6. List Books by Author
Method: GET
Path: /books?author=Achebe
Description: Filters and returns all books written by a specific author using a query parameter.
Request Body: None
Success Status Code: 200 OK
Error Handling Breakdown
400 Bad Request
Description: Triggered when the client sends an invalid request payload or missing required fields.
Concrete Scenario: A client sends a POST /books request missing the required title field, or provides an invalid data type (such as "publishedYear": "nineteen-fifty-eight" instead of an integer).
404 Not Found
Description: Triggered when the client requests a resource path or ID that does not exist in the database.
Concrete Scenario: A client attempts to retrieve, update, or delete a book using a non-existent ID, such as GET /books/99999 or DELETE /books/99999.
