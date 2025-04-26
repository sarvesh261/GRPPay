
# 📱 Group Pay – Temporary Group-Based Payment Sharing App

## 🟣 Overview

Group Pay is a Svelte + Postgres based application designed to solve a real-world issue faced in college canteens: difficulty in pooling small amounts of money from friends for a group order. It enables students to form a **temporary group**, contribute funds to a **group owner**, and make purchases collectively through the owner’s balance.

---

## 🎯 Objective

To build a simple, intuitive, and secure web app where:
- A user (group owner) creates a **temporary group**
- Other members (by roll number) **authorize transfers** of funds to the group creator
- The **creator uses pooled funds** for transactions (like buying food)
- Each user’s remaining balance is stored and updated accordingly

---

## 🧑‍💻 Tech Stack

- **Frontend:** Svelte (Violet-themed UI)
- **Backend:** Node.js (Express or Hono)
- **Database:** PostgreSQL
- **Authentication:** Roll Number + Password (no OTP)
- **Hosting:** (TBD)

---

## 🔐 User Roles

- **User** (Any student with roll number + password)
- **Group Owner** (User who creates a group)

---

## ⏰ Group Rules

- Groups auto-expire after **24 hours**
- Only one **admin (group owner)** per group
- No real-time notifications required (just pull to refresh)

---

## 🧮 Core Features

### ➕ Group Creation
- User creates a new group (title optional)
- Group is assigned a unique ID
- Expires automatically in 24 hours

### 👥 Add Members
- Group owner adds members using their **roll numbers**
- Members appear in group list

### 💸 Fund Transfer
- Members transfer ₹ to the **group owner’s balance**
- Can transfer full or partial amount from their personal wallet

### 📜 Transaction Log
- Shows who paid what (simple ledger-style)
- Visible to all members in group

### 💰 Wallet System
- Each user has a **balance field** in DB
- Balance updates after sending/receiving

---

## 🗂️ Database Schema (PostgreSQL)

### `users`
| Field         | Type      |
|---------------|-----------|
| id            | UUID      |
| roll_number   | TEXT (PK) |
| name          | TEXT      |
| password_hash | TEXT      |
| balance       | NUMERIC   |
| created_at    | TIMESTAMP |

### `groups`
| Field       | Type      |
|-------------|-----------|
| id          | UUID (PK) |
| owner_id    | UUID (FK to users) |
| created_at  | TIMESTAMP |
| expires_at  | TIMESTAMP |

### `group_members`
| Field       | Type      |
|-------------|-----------|
| id          | UUID      |
| group_id    | UUID (FK to groups) |
| user_id     | UUID (FK to users) |

### `transactions`
| Field        | Type      |
|--------------|-----------|
| id           | UUID (PK) |
| group_id     | UUID      |
| sender_id    | UUID (FK to users) |
| receiver_id  | UUID (group owner) |
| amount       | NUMERIC   |
| timestamp    | TIMESTAMP |

---

## 🔌 API Endpoints (Suggestion)

- `POST /register` – Create new user
- `POST /login` – Login with roll_number + password
- `POST /groups` – Create new group
- `POST /groups/:id/add-member` – Add member to group
- `POST /groups/:id/transfer` – Member transfers amount to group owner
- `GET /groups/:id/transactions` – View transaction log
- `GET /me` – Fetch user info including balance

---

## 🎨 UI/UX Notes

- Violet-based theme
- Minimalistic dashboard:
  - My Balance
  - Create Group / Join Group
  - View Transactions
  - Group Overview screen with list of members & amounts

---

## 📦 Future Ideas (Optional)

> None added – keep it simple for now.

---

## 🤖 For AI Agent

Ensure:
- Postgres DB is used with above schema
- All auth is handled via roll number + password
- Frontend built using Svelte with violet theme
- Groups expire automatically after 24 hours
- All money transfers update balances accordingly
