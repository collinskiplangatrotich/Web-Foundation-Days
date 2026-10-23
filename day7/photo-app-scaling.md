# SnapShare System Architecture & Scaling Plan

## 1. Initial Facts & Assumptions

### Given Facts
- **Total Registered Users:** 10,000,000
- **Daily Active Users (DAU) Percentage:** 10%
- **User Upload Behavior:** 1 photo per DAU per day
- **User Consumption Behavior:** 50 feed page views per DAU per day
- **File Sizes:** Original Photo = 2 MB, Thumbnail = 50 KB (0.05 MB)

### Calculations & Assumptions
- **Daily Active Users (DAU):**
  $$\text{DAU} = 10,000,000 \times 0.10 = 1,000,000 \text{ users/day}$$
- **Seconds in a Day:** 86,400 seconds (exact value used for calculations).

---

## 2. Traffic & Storage Estimates

### A. Uploads per Second
- **Total Daily Uploads:** 1,000,000 photos/day
- **Average Uploads / Second:**
  $$\text{Average Upload QPS} = \frac{1,000,000}{86,400} \approx 11.57 \text{ uploads/second}$$
- **Peak Uploads / Second ($5\times$ Peak Factor):**
  $$\text{Peak Upload QPS} = 11.57 \times 5 \approx 57.87 \text{ uploads/second}$$

### B. Feed Views per Second
- **Total Daily Feed Views:** $1,000,000 \times 50 = 50,000,000 \text{ views/day}$
- **Average Feed Views / Second:**
  $$\text{Average Read QPS} = \frac{50,000,000}{86,400} \approx 578.70 \text{ views/second}$$
- **Peak Feed Views / Second ($5\times$ Peak Factor):**
  $$\text{Peak Read QPS} = 578.70 \times 5 \approx 2,893.52 \text{ views/second}$$

### C. Photo Storage per Year
- **Combined Size per Photo Upload:** $2 \text{ MB} + 0.05 \text{ MB} = 2.05 \text{ MB}$
- **Daily Storage Requirement:**
  $$\text{Daily Storage} = 1,000,000 \times 2.05 \text{ MB} = 2,050,000 \text{ MB} = 2.05 \text{ TB/day}$$
- **Annual Storage Requirement (365 days):**
  $$\text{Annual Storage} = 2.05 \text{ TB/day} \times 365 = 748.25 \text{ TB/year}$$

---

## 3. Read vs. Write Ratio & Architectural Impact

**SnapShare is overwhelmingly a read-heavy system.** 

Comparing the traffic numbers:
$$\text{Read QPS} : \text{Write QPS} = 50,000,000 : 1,000,000 = 50 : 1$$

### Design Implications
Because reads outnumber writes by 50:1, the system architecture must be optimized for fast, scalable retrieval rather than heavy transactional writes:
1. **Aggressive Caching Strategy:** Caching user feeds, session tokens, and database query results in memory (e.g., Redis) dramatically reduces load on the primary database.
2. **Database Read Replicas:** Read requests are distributed across multiple read-replica database instances, isolating write operations to the primary node.
3. **Global CDN Edge Caching:** Static media (photos and thumbnails) are served almost exclusively from CDN edge nodes near the user, preventing media bandwidth from hitting application servers.

---

## 4. Media Storage Strategy: Object Storage vs. Relational Database

### Why Photos Should NOT Be Stored in the Database
1. **Database Bloat & Performance Degradation:** Storing Binary Large Objects (BLOBs) directly inside SQL database tables increases database backup sizes, slows down index scans, bloats RAM buffers, and degrades transactional throughput.
2. **Cost & Scalability:** Relational database storage (high-performance SSDs attached to compute instances) is significantly more expensive per gigabyte than specialized cloud object storage and does not scale infinitely.
3. **I/O Bottlenecks:** Serving high-volume binary stream downloads through database connections exhausts connection pools meant for structural data queries.

### Where Photos Should Go Instead
Photo files (both original 2 MB images and 50 KB thumbnails) must be stored in **Cloud Object Storage** (such as AWS S3 or Azure Blob Storage). The relational database stores only the string metadata (e.g., image ID, uploader ID, upload timestamp, and the Object Storage URL link).

---

## 5. System Architecture Diagram

```
                             [ Client / Mobile App ]
                                  |         |
                  +---------------+         +---------------+
                  | Media Requests                  | API / Metadata
                  v                                 v
        +-------------------+             +--------------------+
        |  Content Delivery |             |  Load Balancer     |
        |  Network (CDN)    |             |  (Nginx / ALB)     |
        +-------------------+             +--------------------+
                  | Cache Miss                       |
                  v                                  v
        +-------------------+             +--------------------+
        |  Object Storage   |<------------|  App Servers       |
        |  (AWS S3 / Azure) |             |  (Stateless Node)  |
        +-------------------+             +--------------------+
                  ^                               |       |
                  | Write Thumbnails              |       | Read/Write Metadata
                  |                               v       v
        +-------------------+           +------------------+  +------------------+
        | Background Worker |<-- Queue -| Message Queue    |  | In-Memory Cache  |
        | (Thumbnail Gen)   |             | (RabbitMQ/Kafka) |  | (Redis)          |
        +-------------------+           +------------------+  +------------------+
                  |                                                    |
                  | Write metadata / status                            v
                  +-------------------------------------> +--------------------+
                                                          | Primary Database   |
                                                          | (SQL Write Master) |
                                                          +--------------------+
                                                                    | Replication
                                                                    v
                                                          +--------------------+
                                                          | Read Replica DB    |
                                                          | (SQL Read Only)    |
                                                          +--------------------+
```

---

## 6. Component Explanations

- **CDN (Content Delivery Network):** Geographically caches photo files and thumbnails close to users to reduce latency and decrease load on object storage.
- **Load Balancer:** Distributes incoming network traffic evenly across multiple application servers to prevent any single server from becoming a bottleneck.
- **App Servers:** Executes core business logic, handles user authentication, and orchestrates requests between caches, queues, and databases in a stateless manner.
- **In-Memory Cache (Redis):** Stores pre-computed feed data and frequently accessed user profile information in memory to deliver sub-millisecond read responses.
- **Primary Database (SQL Master):** Handles all write operations, ensuring strict data integrity and consistency for user accounts, posts, and follow metadata.
- **Database Read Replica:** Handles read queries for user feeds and profiles, scaling read capacity independently from the primary write database.
- **Object Storage (S3 / Azure Blob):** Provides durable, scalable, and cost-effective storage specifically built for unstructured binary files like photos and thumbnails.
- **Message Queue (RabbitMQ / Kafka):** Decouples media uploading from image processing by holding thumbnail generation jobs asynchronously.
- **Background Worker:** Consumes thumbnail generation jobs from the queue, processes images, saves thumbnails to Object Storage, and updates database records.

---

## 7. Step-by-Step Photo Upload Flow

1. **Upload Request & Pre-Signed URL Generation:** The client sends a request to the App Server (`POST /photos/upload-url`) requesting permission to upload a photo file.
2. **Pre-Signed URL Issuance:** The App Server validates the user's auth token and requests a time-limited pre-signed upload URL from Object Storage, returning it to the client.
3. **Direct Media Upload:** The client directly uploads the 2 MB raw photo file from their device to Object Storage using the pre-signed URL, bypassing application servers completely.
4. **Metadata Creation:** Upon successful upload, the client sends a completion request to the App Server with photo details (caption, user ID, object storage path).
5. **Database Entry & Event Publishing:** The App Server writes an initial metadata record to the Primary Database and publishes a `generate-thumbnail` event message onto the Message Queue.
6. **Asynchronous Processing:** A Background Worker picks up the job from the Message Queue, downloads the original photo from Object Storage, generates the 50 KB thumbnail image, and writes the thumbnail back to Object Storage.
7. **Cache & Status Update:** The Background Worker updates the photo metadata in the Primary Database with the thumbnail URL and invalidates or updates relevant feed caches in Redis so followers see the new post in their feeds.

---

## 8. System Trade-Offs

1. **Asynchronous Thumbnail Processing vs. Immediate Consistency:**
   - *Trade-off:* By delegating thumbnail creation to an asynchronous queue and worker, photo uploads respond instantaneously to users. However, if a user immediately refreshes their feed right after posting, the thumbnail may temporarily show a loading placeholder until the background worker finishes processing.
2. **Fan-Out on Write vs. Fan-Out on Read (Feed Generation):**
   - *Trade-off:* We utilize pre-computed user feeds pushed into Redis caches on upload (Fan-out on Write). This makes reading feed pages extremely fast and responsive for our 50:1 read-heavy workload, but increases write amplification and storage consumption whenever a user with many followers uploads a photo.
   - 
