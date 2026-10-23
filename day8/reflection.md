# Course Reflection

### Difficult Concepts and Overcoming Them
The most challenging concept in the course was understanding distributed concurrency management and database isolation levels during high-throughput surge operations. Specifically, visualizing how concurrent asynchronous requests interact with database row locks (`SELECT ... FOR UPDATE`), race conditions, and cache invalidation windows required careful study. I overcame this by building isolated SQL schema prototypes, running parallel simulation queries using terminal sessions, and mapping out sequence flow diagrams step-by-step. Reading detailed system design case studies on event-driven architectures further solidified my understanding of how locking and atomic operations function under real-world pressure.

### Capstone Improvements Based on Feedback
Based on architectural review feedback, I would improve the **Hold Expiration Mechanism** within the TicketHub capstone project. In the initial iteration, relying on synchronous polling to check for expired 10-minute seat holds created unnecessary database overhead. I would refine this by introducing an asynchronous event-driven pattern using **Redis Key-Space Notifications** or a delayed message queue (e.g., RabbitMQ Delayed Exchange). When a hold expires, an event automatically triggers a light background worker to reset the seat status to `AVAILABLE` and publish a WebSocket notification updating the user's seat map UI in real time.

### Next Steps in Learning
Moving forward, I plan to deepen my technical expertise in **Distributed Systems Engineering** and **Cloud Infrastructure Automation**. Specifically, I will focus on:
1. Advanced event-driven messaging architectures using **Apache Kafka** for high-throughput stream processing.
2. Container orchestration using **Kubernetes (k8s)** and **Terraform** for automated multi-region deployment and disaster recovery.
3. Implementing advanced caching strategies and tuning relational database performance (PostgreSQL indexing and query optimization) for large-scale production applications.
