# School Database Design & Architecture

## 1. Table Explanations & Relationships

### Entities & Tables

1. **`students`**
   - **Description:** Stores individual student demographic details.
   - **Key Attributes:** `student_id` (Primary Key), `first_name`, `last_name`, `email` (Unique).

2. **`courses`**
   - **Description:** Stores information regarding offered educational courses.
   - **Key Attributes:** `course_id` (Primary Key), `course_name`, `course_code` (Unique).

3. **`enrolments` (Junction / Join Table)**
   - **Description:** Tracks student course registrations and their corresponding performance grade.
   - **Key Attributes:** `enrolment_id` (Primary Key), `student_id` (Foreign Key), `course_id` (Foreign Key), `grade`.

---

### Relationships & Cardinality

- **Relationship Type:** Many-to-Many ($M:N$) between `students` and `courses`.
  - A single **student** can enrol in **many courses**.
  - A single **course** can contain **many students**.

- **Why a Join Table is Needed:**
  Directly linking `students` and `courses` in a relational database without a bridge table is impossible without violating normalization rules (such as 1NF/1st Normal Form). 
  - Storing a list of course IDs inside a single student row creates multivalued attribute columns or unscalable comma-separated strings.
  - Adding a junction table (`enrolments`) converts the $M:N$ relationship into two separate One-to-Many ($1:N$) relationships:
    1. One `student` to many `enrolments`.
    2. One `course` to many `enrolments`.
  
  Furthermore, contextual metadata specific to the relationship itself—such as the student's assigned **`grade`**—belongs naturally on the bridge record rather than on either individual entity table.

---

## 2. Performance & Indexing Strategy

### Proposed Index

```sql
CREATE INDEX idx_enrolments_student_id ON enrolments(student_id);
```

### Reason for Addition

In a relational school schema, query patterns frequently join the `enrolments` table with the `students` table to fetch course lists or calculate GPAs per student (e.g., `WHERE student_id = ?`). Without an index on the foreign key `student_id` in `enrolments`, SQL engine query planners must execute full table scans across the entire `enrolments` table for every lookup. Adding an index on `enrolments(student_id)` turns linear $O(N)$ searches into logarithmic $O(\log N)$ B-Tree index lookups, drastically improving join performance as enrolment volume scales into thousands or millions of records.

---

## 3. Technology Evaluation: SQL vs. NoSQL

For a school enrolment management system, **SQL (Relational Database)** is the vastly superior architecture choice compared to NoSQL. School registration and grading systems require strict relational data integrity, structural consistency, and multi-record transactions—such as enforcing unique student emails, ensuring foreign key constraints (preventing orphan grades), and applying multi-column unique rules (preventing duplicate enrolments). Relational SQL engines provide native **ACID (Atomicity, Consistency, Isolation, Durability)** guarantees out of the box, ensuring data accuracy during simultaneous course registrations. NoSQL document stores (like MongoDB) would require complex manual application-level constraints and run the risk of data duplication (e.g., embedding duplicated course details across thousands of student documents), introducing synchronization issues whenever course titles or prerequisites change.