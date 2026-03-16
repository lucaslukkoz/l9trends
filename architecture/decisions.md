# Architecture Decisions

This document records important technical decisions for the project.

These decisions help maintain consistency as the system grows.

---

## ADR-001

Decision:

Use Docker Compose for local development.

Reason:

Provides a consistent development environment and simplifies service management.

---

## ADR-002

Decision:

Use Redis and BullMQ for background jobs.

Reason:

Allows scalable background processing for tasks such as:

* email synchronization
* notifications
* AI processing

---

## ADR-003

Decision:

Use a service-based backend architecture.

Structure:

controllers → services → database

Reason:

Separates API logic from business logic and keeps the codebase maintainable.
