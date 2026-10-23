# TicketHub System Design & Architecture Specification

This document details the end-to-end system design for **TicketHub**, an event ticketing platform built to handle routine daily operations as well as high-concurrency surge sales for major concert tours.

---

## 1. Requirements

### Functional Requirements
1. **Event & Venue Browsing:** Users can search and view upcoming concerts, events, seating charts, and ticket prices.
2. **Real-time Seat Reservation (Hold):** Users can select specific available seats and temporarily place a 10-minute hold on them while completing checkout.
3. **Checkout & Payment:** Users can securely process payments for held seats.
4. **Ticket Issuance & Management:** Users can view purchased tickets along with dynamic barcodes/QRs for venue entry.
5. **Inventory & Order History:** Administrators and venue organizers can view ticket sales reports and manage event seating inventories.

### Non-Functional Requirements
1. **Correctness (Zero Double-Booking Guarantee):** Under no circumstance can two users purchase or hold the exact same physical seat for an event ($100\%$ inventory isolation).
2. **Fairness (First-Come, First-Served under High Surge):** During high-demand sales, access to seat allocation must be processed in strict, deterministic queue order to prevent bot hoarding and race conditions.
3. **Speed & Latency:**
   - Browsing/Read pages: Response times under **50 ms**.
   - Seat selection and reservation (hold): Response times under **200 ms** under normal load and under **1,000 ms** during peak surge sales.
4. **High Availability:** 99.99% uptime target for browsing and ticket retrieval.
5. **Data Consistency & Durability:** Transactional financial processing requires strict ACID compliance; seat allocations and completed orders must never be lost.

---

## 2. Load and Capacity Estimations

### Given Facts
- **Registered Users:** 2,000,000
- **Normal Day Traffic:** 50,000 daily active visitors (10 page views/user/day)
- **Normal Day Sales:** 5,000 tickets sold/day
- **Surge Sale ("Big Sale"):** 200,000 users attempting to purchase 20,000 available seats within the first **10 minutes** ($600 \text{ seconds}$).

---

### Normal Traffic Estimates

#### Read Operations
- **Total Daily Page Views:** $50,000 \times 10 = 500,000 \text{ page views/day}$
- **Average Read QPS:** 
  $$\text{Average Read QPS} = \frac{500,000}{86,400 \text{ seconds}} \approx \mathbf{5.79 \text{ QPS}}$$
- **Peak Read QPS ($5\times$ multiplier):**
  $$\text{Peak Read QPS} = 5.79 \times 5 = \mathbf{28.93 \text{ QPS}}$$

#### Write Operations (Ticket Purchases)
- **Total Daily Ticket Purchases:** $5,000 \text{ sales/day}$
- **Average Write QPS:**
  $$\text{Average Write QPS} = \frac{5,000}{86,400 \text{ seconds}} \approx \mathbf{0.058 \text{ QPS}}$$
- **Peak Write QPS ($5\times$ multiplier):**
  $$\text{Peak Write QPS} = 0.058 \times 5 = \mathbf{0.29 \text{ QPS}}$$

---

### Surge Traffic ("Big Sale") Estimates

When a popular concert goes on sale, 200,000 users flood the system in 10 minutes ($600 \text{ seconds}$).

#### Surge Read & Search Traffic
Assumptions: Each active user refreshes/queries event and seat status every 10 seconds during the surge window ($600 / 10 = 60 \text{ views/user}$).
- **Total Surge Page Views:** $200,000 \times 60 = 12,000,000 \text{ requests / 10 mins}$
- **Surge Read QPS:**
  $$\text{Surge Read QPS} = \frac{12,000,000}{600 \text{ seconds}} = \mathbf{20,000 \text{ QPS}}$$

#### Surge Write & Reservation Attempts
Assumptions: All 200,000 users attempt to place a seat hold within the first 10 minutes.
- **Total Hold Attempts:** 200,000 attempts / 600 seconds
- **Surge Write/Hold QPS:**
  $$\text{Surge Write QPS} = \frac{200,000}{600 \text{ seconds}} = \mathbf{333.33 \text{ QPS}}$$

---

### Traffic Comparison Table

| Metric | Normal Day Traffic | Surge "Big Sale" Traffic | Surge vs. Normal Ratio |
| :--- | :--- | :--- | :--- |
| **Active Users / Window** | 50,000 / day | 200,000 / 10 mins | **$\mathbf{\approx 576 \times}$ Traffic Rate Density** |
| **Read Query QPS** | 5.79 QPS | 20,000 QPS | **$\mathbf{\approx 3,454 \times}$ Increase** |
| **Write/Hold Attempt QPS** | 0.058 QPS | 333.33 QPS | **$\mathbf{\approx 5,747 \times}$ Increase** |
| **Inventory Capacity** | Steady | 20,000 total seats | 10 buyers per seat ratio |

---

## 3. REST API Endpoint Specification

### 1. `GET /api/v1/events`
- **Description:** Browses and searches available events with pagination and filtering.
- **Success Response (`200 OK`):**
  ```json
  {
    "events": [
      {
        "id": 101,
        "title": "World Tour 2026",
        "artist": "Echo & The Beats",
        "venue": "Nairobi National Stadium",
        "event_date": "2026-12-15T19:00:00Z",
        "min_price": 50.00
      }
    ],
    "pagination": { "page": 1, "per_page": 20, "total": 120 }
  }
  ```

### 2. `GET /api/v1/events/{id}/seats`
- **Description:** Returns a seat map layout and live availability status for a specific event.
- **Success Response (`200 OK`):**
  ```json
  {
    "event_id": 101,
    "seats": [
      {
        "seat_id": 4051,
        "section": "VIP-A",
        "row_number": "12",
        "seat_number": "A-14",
        "price": 150.00,
        "status": "AVAILABLE"
      }
    ]
  }
  ```

### 3. `POST /api/v1/events/{id}/holds`
- **Description:** Places a temporary 10-minute hold on one or more selected seats.
- **Request Payload:**
  ```json
  {
    "seat_ids": [4051]
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "hold_token": "hold_sec_88492019a",
    "event_id": 101,
    "seat_ids": [4051],
    "expires_at": "2026-10-23T10:34:00Z"
  }
  ```
- **Error Response (`409 Conflict`):**
  ```json
  {
    "error": {
      "code": "SEAT_UNAVAILABLE",
      "message": "One or more requested seats are currently reserved or sold."
    }
  }
  ```

### 4. `POST /api/v1/orders`
- **Description:** Converts an active seat hold token into a paid order.
- **Request Payload:**
  ```json
  {
    "hold_token": "hold_sec_88492019a",
    "payment_method_id": "pm_card_visa_882",
    "idempotency_key": "idem_908234-91283-91283"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "order_id": "ord_994182",
    "status": "COMPLETED",
    "total_amount": 150.00,
    "seats_booked": [4051],
    "created_at": "2026-10-23T10:26:30Z"
  }
  ```

### 5. `GET /api/v1/tickets`
- **Description:** Fetches all purchased tickets and entry passes for the authenticated user.
- **Success Response (`200 OK`):**
  ```json
  {
    "tickets": [
      {
        "ticket_id": 88120,
        "order_id": "ord_994182",
        "event_title": "World Tour 2026",
        "section": "VIP-A",
        "seat": "A-14",
        "qr_code_url": "https://cdn.tickethub.com/qr/tk_88120.png"
      }
    ]
  }
  ```

---

## 4. Data Model Schema Specification

```sql
-- Enable Strict Foreign Key Rules
PRAGMA foreign_keys = ON;

-- 1. Users Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Events Table
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(150) NOT NULL,
    venue_name VARCHAR(150) NOT NULL,
    event_start TIMESTAMP NOT NULL,
    total_capacity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Seats Table
CREATE TABLE seats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    section VARCHAR(50) NOT NULL,
    row_number VARCHAR(10) NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- Values: AVAILABLE, HELD, BOOKED
    version INTEGER NOT NULL DEFAULT 1,             -- For Optimistic Concurrency Control
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT unique_seat_per_event UNIQUE (event_id, section, row_number, seat_number)
);

-- 4. Orders Table
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- Values: PENDING, COMPLETED, EXPIRED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- 5. Order_Items Junction Table
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id VARCHAR(50) NOT NULL,
    seat_id INTEGER NOT NULL UNIQUE,                -- Unique rule guarantees 1 seat strictly belongs to 1 order
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id)
);

-- Database Performance Indexing
CREATE INDEX idx_seats_event_status ON seats(event_id, status);
CREATE INDEX idx_orders_user ON orders(user_id);
```

---

## 5. Preventing Double-Booking: Concurrency & Transaction Strategy

Double-booking prevention is enforced through a two-tiered defense mechanism utilizing SQL Database Constraints, Explicit Transaction Row Locks (`SELECT ... FOR UPDATE`), and Redis Atomic Distributed Locks.

### Strict Database Level Constraints & Explicit Row Locking

When a user requests a hold on seat ID `4051`, the system executes an atomic transaction with explicit row-level locking:

```sql
BEGIN TRANSACTION;

-- Step 1: Explicitly lock the seat row for update
SELECT id, status, version 
FROM seats 
WHERE id = 4051 AND event_id = 101 AND status = 'AVAILABLE' 
FOR UPDATE;

-- Step 2: If no row returned or status != 'AVAILABLE', ROLLBACK and reject second user
UPDATE seats 
SET status = 'HELD', 
    version = version + 1 
WHERE id = 4051 AND status = 'AVAILABLE';

-- Step 3: Insert initial pending order record
INSERT INTO orders (id, user_id, event_id, total_amount, status) 
VALUES ('ord_994182', 501, 101, 150.00, 'PENDING');

INSERT INTO order_items (order_id, seat_id, price) 
VALUES ('ord_994182', 4051, 150.00);

COMMIT;
```

### Key Safety Guarantees
1. **Pessimistic Row Locking (`FOR UPDATE`):** If two users submit a hold request for Seat `4051` at the exact same millisecond, the database engine queues the second query behind the lock held by the first query.
2. **Atomic Status Mutation:** The first transaction sets status from `AVAILABLE` to `HELD`. When the second queued transaction executes, its `WHERE status = 'AVAILABLE'` filter fails to match any row, triggering an immediate `409 Conflict` error back to the second buyer.
3. **Database Unique Constraints:** The `UNIQUE(seat_id)` constraint on the `order_items` table acts as a fail-safe hard stop at the engine storage level, preventing duplicate insert mapping under any condition.
4. **10-Minute Hold Expiration (Redis TTL):** The hold state is tracked with a 10-minute expiration key in Redis (`hold:seat:4051`). If the order is not paid within 600 seconds, a background daemon automatically converts the seat status back to `AVAILABLE`.

---

## 6. Architecture Diagram & Surge Survival Strategy

```
                           [ 200,000 Buyers ]
                                   |
                                   v
                       [ Cloudflare CDN / WAF ]
                  (Rate Limiting & Static Assets)
                                   |
                                   v
                      [ Virtual Waiting Room ]
                  (Queue-IT Token Bucket Ingress)
                                   | (Throttled Flow)
                                   v
                    [ Application Load Balancer ]
                                   |
            +----------------------+----------------------+
            |                                             |
            v                                             v
  [ App Server Node 1 ]                         [ App Server Node 2 ]
  (Stateless API Service)                       (Stateless API Service)
      |          |                                   |          |
      |          +--------------+     +--------------+          |
      v                         v     v                         v
+---------------+        +-------------------+        +--------------------+
| Redis Cluster |        | Message Queue     |        | Primary PostgreSQL |
| (Seat Map     |        | (RabbitMQ)        |        | (ACID Writes &     |
|  Cache & TTL) |        +-------------------+        |  Row Locks)        |
+---------------+                  |                  +--------------------+
                                   v                            |
                           [ Order Processing ]                 v Replication
                           [ Worker Service   ]       +--------------------+
                                                      | Read Replica DB    |
                                                      | (Seat Map Queries) |
                                                      +--------------------+
```

### Component Explanations & Surge Architecture Controls

1. **Virtual Waiting Room (Queue Gatekeeper):** During a 200,000-user surge, traffic is redirected through a virtual queue. It admits only $1,000$ users per minute onto the checkout platform using cryptographic JWT entry tokens, shielding backend servers from crashing.
2. **Cloudflare Edge CDN:** Caches global static assets and initial event details, serving 20,000 QPS read spikes away from origin infrastructure.
3. **Application Load Balancer (ALB):** Distributes incoming authenticated requests across horizontally autoscaling application nodes.
4. **Stateless App Nodes:** Executes authorization, validation, and transaction logic.
5. **Redis Cluster (In-Memory Inventory & TTL):** Stores real-time seat availability maps and 10-minute hold keys to allow instantaneous sub-10ms seat map lookups without touching the disk database.
6. **Primary PostgreSQL (Write Engine):** Executes strict `SELECT ... FOR UPDATE` row locks for seat holds and order completions.
7. **Read Replicas:** Serves read queries for user ticket histories and event listings.
8. **RabbitMQ & Worker Services:** Decouples order confirmation emails, ticket PDF generation, and push notifications asynchronously.

---

## 7. System Trade-Offs

1. **Virtual Waiting Room vs. Immediate Platform Access:**
   - *Trade-off:* Forcing surge buyers into a virtual waiting room introduces user friction and wait times. However, this trade-off prevents complete system collapse, guaranteeing operational stability and fair order processing for everyone in line.
2. **Pessimistic Row Locking vs. Throughput Scalability:**
   - *Trade-off:* Utilizing `FOR UPDATE` pessimistic row locking in PostgreSQL creates a bottleneck at the primary database write layer during peak surges. However, this trade-off is necessary because absolute data correctness (zero double-bookings) takes priority over write speed.
