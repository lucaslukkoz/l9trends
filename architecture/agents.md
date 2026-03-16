# AI Agents

This project uses a multi-agent workflow for feature development.

Each agent has a specific responsibility to keep the system organized and scalable.

---

## Architecture Agent

Responsible for planning new features before implementation.

Responsibilities:

* analyze feature requests
* review project.md
* identify system impact
* create implementation plans
* coordinate backend, frontend and devops agents

The Architecture Agent must always create a plan before coding.

---

## Backend Agent

Responsible for server-side development.

Responsibilities:

* API endpoints
* controllers
* services
* business logic
* database models
* authentication
* integrations
* queues and background workers

---

## Frontend Agent

Responsible for the user interface.

Responsibilities:

* UI components
* pages and dashboards
* API integration
* state management
* user interaction flows

---

## DevOps Agent

Responsible for infrastructure and system environment.

Responsibilities:

* Docker configuration
* environment variables
* Redis
* queues
* deployment configuration
* system reliability

---

## Review Agent

Responsible for code validation.

Responsibilities:

* verify architecture consistency
* check coding standards
* detect bugs
* identify security issues
* prevent regressions
