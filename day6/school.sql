```sql
-- Day 6 Assignment: School Database (SQLite Compatible)

-- Enable foreign key constraints in SQLite
PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. CREATE TABLE STATEMENTS
-- ============================================================================

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_name TEXT NOT NULL,
    course_code TEXT NOT NULL UNIQUE
);

-- Enrolments Table (Junction Table for Many-to-Many Relationship)
CREATE TABLE IF NOT EXISTS enrolments (
    enrolment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE (student_id, course_id) -- Rule preventing the same student enrolling on the same course twice
);

-- ============================================================================
-- 2. INSERT SAMPLE DATA
-- ============================================================================

-- Insert at least 3 Students (Adding 4 to demonstrate students with no enrolments)
INSERT INTO students (first_name, last_name, email) VALUES
('Amina', 'Ochieng', 'amina.ochieng@example.com'),
('Brian', 'Mwangi', 'brian.mwangi@example.com'),
('Chebet', 'Kiprono', 'chebet.kiprono@example.com'),
('David', 'Kilu', 'david.kilu@example.com'); -- David will have no enrolments

-- Insert at least 3 Courses
INSERT INTO courses (course_name, course_code) VALUES
('Cloud Computing Fundamentals', 'AZ-900'),
('Web Development 101', 'WEB-101'),
('Database Systems & SQL', 'DB-201');

-- Insert at least 5 Enrolments
INSERT INTO enrolments (student_id, course_id, grade) VALUES
(1, 1, 'A'),   -- Amina -> AZ-900
(1, 2, 'B+'),  -- Amina -> WEB-101
(2, 1, 'B'),   -- Brian -> AZ-900
(2, 3, 'A-'),  -- Brian -> DB-201
(3, 2, 'A');   -- Chebet -> WEB-101

-- ============================================================================
-- 3. FIVE REQUIRED QUERIES
-- ============================================================================

-- Query 1: All courses for one student (by name)
SELECT 
    s.first_name || ' ' || s.last_name AS student_name,
    c.course_code,
    c.course_name,
    e.grade
FROM students s
JOIN enrolments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE s.first_name = 'Amina' AND s.last_name = 'Ochieng';

-- Query 2: All students on one course (e.g., 'Cloud Computing Fundamentals')
SELECT 
    c.course_name,
    s.first_name || ' ' || s.last_name AS student_name,
    s.email,
    e.grade
FROM courses c
JOIN enrolments e ON c.course_id = e.course_id
JOIN students s ON e.student_id = s.student_id
WHERE c.course_name = 'Cloud Computing Fundamentals';

-- Query 3: The number of students per course
SELECT 
    c.course_code,
    c.course_name,
    COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_code, c.course_name;

-- Query 4: Students who have no enrolments
SELECT 
    s.student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    s.email
FROM students s
LEFT JOIN enrolments e ON s.student_id = e.student_id
WHERE e.enrolment_id IS NULL;

-- Query 5: Update of one enrolment's grade
UPDATE enrolments
SET grade = 'A+'
WHERE student_id = (SELECT student_id FROM students WHERE email = 'brian.mwangi@example.com')
  AND course_id = (SELECT course_id FROM courses WHERE course_code = 'AZ-900');

-- Optional verification check after UPDATE
SELECT 
    s.first_name || ' ' || s.last_name AS student_name,
    c.course_code,
    e.grade
FROM enrolments e
JOIN students s ON e.student_id = s.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE s.email = 'brian.mwangi@example.com' AND c.course_code = 'AZ-900';
```
