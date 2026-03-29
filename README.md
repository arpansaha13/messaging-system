<h1 align="center">
  Chat Application Project
</h1>

## Overview

Full-stack real-time messaging app. Supports one-to-one personal chats, group messaging with channels, and real-time features like typing indicators, read receipts, and online/offline status.

### Key Features

- **One-to-One Messaging**: Direct messaging between users with read receipts
- **Group Chats**: Create groups and organize conversations with multiple channels
- **Channels**: Each group has multiple channels for categorized discussions
- **Read Receipts**: Sent, Delivered, and Read status indicators
- **Online/Offline Status**: Real-time presence detection using Memcached
- **Typing Indicators**: See when someone is typing
- **Scalable Architecture**: Multi-server WebSocket setup with RabbitMQ message queuing
- **Chat Management**: Archive, pin, clear, and delete conversations
- **Contacts**: Add users to your contact list with custom aliases

## Technology Stack

### Frontend

- **Nuxt 4**: Full-stack Vue framework with SSR support
- **Vue 3**: Composition API for reactive components
- **TailwindCSS**: Utility-first CSS framework
- **WebSocket**: Native WebSocket API

### Backend

- **Go + Gorilla Mux**: RESTful API server
- **GORM**: Object-Relational Mapping for database
- **Gorilla WebSockets**: Simple WebSocket implementation for Go
- **PostgreSQL**: Primary relational database
- **RabbitMQ**: Message queue for distributing events across servers
- **Memcached**: In-memory cache for online/offline status
- **Testcontainers**: Integration testing with containerized dependencies

### Testing

- **Playwright**: End-to-End testing framework

### Infrastructure

- **Docker**: Containerization for all services
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and TLS termination

### Centralized Logging

- **Zap** (Go): High-performance JSON logging library
- **Fluent-bit**: Lightweight log collection and parsing
- **Apache Kafka**: Distributed message queue
- **Grafana Alloy**: Multi-signal collection and processing
- **Grafana Loki**: Log aggregation and querying
- **Grafana**: Visualization and alerting

## Key Concepts

### Temporary Messages

When a user sends a message, the frontend shows it immediately with a "sending" spinner. The API call happens in the background. On success, the status flips to "sent" (single tick).

### Scalable WebSocket Architecture

RabbitMQ distributes real-time events across multiple WebSocket servers. Adding another server doesn't require any coordination layer. Routing is handled by RabbitMQ bindings.

### Online/Offline Indicator

Presence is tracked in Memcached with TTL-based expiration. Connected users refresh their TTL every few seconds via heartbeat. Clients poll periodically for their contacts' status.

### Read Receipts Flow

Three-stage receipt system:

- Sent (the message is persisted)
- Delivered (client received the message)
- Read (user viewed the message)

## Documentation Structure

1. **[Architecture](https://arpansaha13.netlify.app/projects/chat-application/architecture)** - High-level system design
2. **[Database Design](https://arpansaha13.netlify.app/projects/chat-application/database-design)** - Schema and entity relationships
3. **[Scalable WebSockets](https://arpansaha13.netlify.app/projects/chat-application/scalable-websockets)** - RabbitMQ integration
4. **[Personal Chats](https://arpansaha13.netlify.app/projects/chat-application/personal-chats)** - One-to-one messaging flow
5. **[Group Chats](https://arpansaha13.netlify.app/projects/chat-application/group-chats)** - Multi-user conversations with channels
6. **[Read Receipts](https://arpansaha13.netlify.app/projects/chat-application/read-receipts)** - Three-stage delivery tracking
7. **[Online/Offline Status](https://arpansaha13.netlify.app/projects/chat-application/online-offline-indicator)** - Presence detection implementation
8. **[Centralized Logging](https://arpansaha13.netlify.app/projects/chat-application/centralized-logging)** - Centralized logging implementation
9. **[Temporary Messages](https://arpansaha13.netlify.app/projects/chat-application/temporary-messages)** - Optimistic message handling

## Project History

- **Version 0.1** (Nov 2023): Initial implementation with basic messaging
- **Version 0.2** (Aug 2024): Improved database design and revamped UI
- **Version 0.3** (Nov 2024): Added group chats with channels, client-side caching
- **Version 0.4** (Jan 2026): Scalable architecture with RabbitMQ, multi-server support, Memcached integration

Check out the full project evolution at [Project History](https://arpansaha13.netlify.app/projects/chat-application/project-history).

## Getting Started

Start with [Architecture](https://arpansaha13.netlify.app/projects/chat-application/architecture) to understand the system layout, then [Database Design](https://arpansaha13.netlify.app/projects/chat-application/database-design) to see how data is structured. From there, dig into whichever feature interests you.

## A Note on these Docs

This is an evolving project. Decisions documented here made sense at the time and may not be the only way to approach the problem. If something looks off, I'm open to feedback.
