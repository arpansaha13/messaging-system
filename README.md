<h1 align="center">
  Chat Application Project
</h1>

## Overview

This is a full-stack real-time messaging application built with a modern, scalable architecture. The system supports one-to-one personal chats, group messaging with channels, and real-time features like typing indicators, read receipts, and online/offline status.

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
- **Socket.IO Client**: Real-time WebSocket client

### Backend

- **Go + Gorilla Mux**: RESTful API server
- **GORM**: Object-Relational Mapping for database
- **PostgreSQL**: Primary relational database
- **RabbitMQ**: Message queue for distributing events across servers
- **Socket.IO (Node.js)**: WebSocket server for real-time communication
- **Memcached**: In-memory cache for online/offline status
- **Testcontainers**: Integration testing with containerized dependencies

### Infrastructure

- **Docker**: Containerization for all services
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and TLS termination
- **JWT**: Authentication tokens

## Key Concepts

### Temporary Messages

Messages go through a "temporary" state before being persisted to the database. This dual-state approach optimizes user experience by showing messages immediately while ensuring data consistency.

### Scalable WebSocket Architecture

The system uses RabbitMQ to distribute real-time events across multiple Socket.IO servers, enabling horizontal scaling.

### Online/Offline Indicator

A distributed presence system using Memcached stores active user sessions across all servers, allowing accurate status updates.

### Read Receipts Flow

Three-stage receipt system:

- Sent (message in database)
- Delivered (received by client)
- Read (user viewed message)

## Documentation Structure

Navigate through these sections to understand different aspects of the system:

1. **[Database Design](https://arpansaha13.netlify.app/projects/chat-application/database-design)** - Schema and entity relationships
2. **[Architecture Overview](https://arpansaha13.netlify.app/projects/chat-application/architecture-overview)** - High-level system design
3. **[Scalable WebSockets](https://arpansaha13.netlify.app/projects/chat-application/scalable-websockets)** - RabbitMQ integration
4. **[Personal Chats](https://arpansaha13.netlify.app/projects/chat-application/personal-chats)** - One-to-one messaging flow
5. **[Group Chats](https://arpansaha13.netlify.app/projects/chat-application/group-chats)** - Multi-user conversations with channels
6. **[Read Receipts](https://arpansaha13.netlify.app/projects/chat-application/read-receipts)** - Three-stage delivery tracking
7. **[Online/Offline Status](https://arpansaha13.netlify.app/projects/chat-application/online-offline-indicator)** - Presence detection implementation
8. **[Temporary Messages](https://arpansaha13.netlify.app/projects/chat-application/temporary-messages)** - Dual-state message handling

## Project History

- **Version 1** (Nov 2023): Initial implementation with basic messaging
- **Version 2** (Aug 2024): Improved database design and revamped UI
- **Version 3** (Nov 2024): Added group chats with channels, client-side caching
- **Version 4** (Jan 2026): Scalable architecture with RabbitMQ, multi-server support, Memcached integration

## Getting Started

To understand the system:

1. Start with the [Database Design](https://arpansaha13.netlify.app/projects/chat-application/database-design) to understand data models
2. Review the [Architecture Overview](https://arpansaha13.netlify.app/projects/chat-application/architecture-overview) for system components
3. Dive into specific features based on your interest

For implementation details, each section includes code examples and diagrams.

## Philosophy

This documentation represents an evolving project. The implementations are based on pragmatic decisions as of 2025. Different approaches exist, and constructive criticism is welcome. The goal is to create a maintainable, scalable, and understandable codebase that demonstrates best practices in real-time application design.
