# Study Organizer

A platform to organize study topics, with sign-up, login, and email verification.

## Features

- Sign-up and login with JWT authentication
- Email verification with a 6-digit code
- CRUD for study topics, linked to each user
- Notes and images on each topic

## Tech Stack

- **Front-end:** React, TypeScript, Vite
- **Back-end:** Node.js, Express, TypeScript
- **Database:** SQLite
- **Authentication:** JWT and bcrypt
- **Email:** Nodemailer

## Project Structure

```
client/   # front-end (React)
server/   # API (Express + SQLite)
```

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm

### 1. Back-end

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

On Windows (PowerShell), use `copy .env.example .env`.

Fill in the `.env` file:

```
SEGREDO=a-long-random-secret-key
PORT=3000
```

`SEGREDO` is the secret used to sign the JWT tokens. Use a long, random value and never commit it.

### 2. Front-end

```bash
cd client
npm install
npm run dev
```

If the front-end uses `VITE_API_URL`, create a `client/.env` file with the API address:

```
VITE_API_URL=http://localhost:3000
```

## Author

Made by [Thiago Gregorio](https://github.com/ThiagoGregorio13).
