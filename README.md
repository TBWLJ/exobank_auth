# Auth Service

<p align="left">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Auth%20Store-336791?logo=postgresql&logoColor=white">
  <img alt="Redis" src="https://img.shields.io/badge/Redis-OTP%20%26%20Rate%20Limit-DC382D?logo=redis&logoColor=white">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white">
</p>

Authentication microservice for the fintech platform.

## Responsibilities

- User registration
- OTP generation and verification
- Login and JWT issuance
- Refresh token persistence and rotation
- Logout via refresh-token revocation
- Auth audit logging

## Architecture

```text
Client -> API Gateway -> Auth Service -> PostgreSQL
                                 \-> Redis (OTP + rate limit)
```

## Project Structure

```text
auth-service/
├── prisma/
├── src/
│   ├── config/
│   ├── constants/
│   ├── controllers/
│   ├── middlewares/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   └── app.js
├── .env.example
├── package.json
└── server.js
```

## Prerequisites

- Node.js `18+`
- `pnpm`
- PostgreSQL
- Redis

## Environment Variables

Use `.env.example` as your template.

| Variable | Description |
|---|---|
| `NODE_ENV` | Environment (`development`, `production`) |
| `PORT` | Service port (default `4000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `JWT_ACCESS_TTL` | Access token TTL (default `15m`) |
| `JWT_REFRESH_TTL` | Refresh token TTL (default `7d`) |
| `REDIS_URL` | Redis connection string |
| `OTP_TTL_SECONDS` | OTP TTL in seconds |
| `RATE_LIMIT_WINDOW_SECONDS` | Rate-limit window |
| `RATE_LIMIT_MAX_ATTEMPTS` | Max requests per window |

## Setup

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

## Health Check

- `GET /health`

## API Endpoints

Base URL: `http://localhost:4000`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register user and generate OTP |
| `POST` | `/auth/verify` | Verify OTP and activate user |
| `POST` | `/auth/resend-otp` | Resend OTP for pending user |
| `POST` | `/auth/login` | Return access + refresh tokens |
| `POST` | `/auth/refresh` | Rotate refresh token and issue new access token |
| `POST` | `/auth/logout` | Revoke refresh token |
| `GET` | `/auth/me` | Return JWT claims for authenticated user |
| `GET` | `/auth/admin/ping` | Admin-protected test endpoint |

## Security Notes

- Passwords are hashed using bcrypt (`12` rounds).
- Access tokens are short-lived.
- Refresh tokens are persisted in DB and revocable.
- Rate limiting protects registration/login/OTP endpoints.
- OTP is stored in Redis with expiry.

## License

ISC
