# 🚦 Distributed Rate Limiter

A production-ready **Distributed Rate Limiter** built with **Node.js**, **Express**, and **Redis**. This project demonstrates how modern APIs protect themselves from abuse by limiting the number of requests a client can make within a specified time window. The system is designed using the **Strategy Pattern**, making it easy to add or switch between multiple rate-limiting algorithms.

---

## 📖 Overview

Rate limiting is an essential part of scalable backend systems. It helps prevent API abuse, brute-force attacks, and server overload while ensuring fair resource usage among clients.

This project implements a distributed rate limiter using Redis as the centralized data store, allowing multiple application instances to share rate-limiting state seamlessly.

---

## ✨ Features

* 🚀 Distributed rate limiting using Redis
* 🔄 Strategy Pattern for interchangeable algorithms
* 📊 Fixed Window algorithm implementation
* 📈 Sliding Window algorithm
* ⚡ Atomic Redis operations
* 🔒 Protects APIs from excessive requests
* 📝 Configurable request limits and time windows
* 🛠 Clean, modular project architecture
* 📦 Easy to extend with Token Bucket or Leaky Bucket algorithms

---

## 🛠 Tech Stack

### Backend

* Node.js
* Express.js

### Database

* Redis

### Tools & Libraries

* ioredis / redis
* dotenv
* nodemon

---

## 📂 Project Structure

```text
Distributed-Rate-Limiter/
│
├── algorithms/
│   ├── fixedWindow.js
│   ├── slidingWindow.js
│
├── config/
│   ├── redis.js
│
├── middleware/
│   ├── rateLimiter.js
│
├── strategies/
│   ├── strategyFactory.js
│
├── routes/
│
├── tests/
│
├── app.js
├── server.js
├── package.json
└── README.md
```

---

## ⚙️ System Architecture

```text
Client
   │
   ▼
Express API
   │
Rate Limiter Middleware
   │
Strategy Factory
   │
Selected Algorithm
   │
Redis
   │
Allow / Block Request
```

---

## 🚀 Implemented Algorithms

### ✅ Fixed Window

* Uses Redis counters.
* Counts requests in a fixed time interval.
* Very fast and memory efficient.
* Simple implementation.

### ✅ Sliding Window

* Uses Redis Sorted Sets (ZSET).
* Removes expired timestamps.
* Counts only requests inside the current time window.
* More accurate than Fixed Window.

---
