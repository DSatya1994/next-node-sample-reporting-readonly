# FullStack App — Next.js + Node.js

A production-ready full-stack application featuring JWT-based authentication,
a read-only MSSQL database query runner, and a clean Tailwind UI.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Features](#4-features)
5. [Environment Variables](#5-environment-variables)
6. [Local Development Setup](#6-local-development-setup)
7. [API Reference](#7-api-reference)
8. [Adding Query Codes](#8-adding-query-codes)
9. [Deploy to AWS EC2](#9-deploy-to-aws-ec2)
10. [Security Notes](#10-security-notes)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Architecture Overview

```
Browser
  │
  ▼
Nginx (port 80 / 443)
  ├── /api/*  ──────────►  Express backend  (port 5000)
  └── /*      ──────────►  Next.js frontend (port 3000)
                                │
                                └─ /api/* rewrites ──► backend (dev only)
```

**In development** (no Nginx):
- The Next.js dev server proxies `/api/*` requests to the Express backend
  via the `rewrites` setting in `next.config.js`.
- Cookies are set on `localhost` and forwarded transparently.

**In production** (Nginx):
- Nginx handles all routing. `/api/*` goes directly to Express; `/*` goes to Next.js.
- Both services run as background processes managed by PM2.

---

## 2. Tech Stack

| Layer      | Technology |
|-----------|------------|
| Frontend  | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS 3 |
| Backend   | Node.js 20, Express 4, cookie-parser, jsonwebtoken |
| Database  | MSSQL (read-only, via `mssql` package) |
| Auth      | JWT stored as HTTP-only cookie (XSS-safe) |
| Process   | PM2 (production process manager) |
| Proxy     | Nginx (reverse proxy + SSL termination) |

---

## 3. Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js          # MSSQL connection pool
│   │   │   ├── queries.json   # Named SQL queries (code → SQL mapping)
│   │   │   └── users.js       # Parses USERS env var
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT validation middleware
│   │   ├── routes/
│   │   │   ├── auth.js        # POST /api/auth/login, POST /api/auth/logout
│   │   │   ├── datetime.js    # GET  /api/datetime
│   │   │   ├── query.js       # GET  /api/query/codes, POST /api/query/run
│   │   │   └── users.js       # GET  /api/users
│   │   └── index.js           # Express app entry point
│   ├── .env                   # ← your secrets (git-ignored)
│   ├── .env.example           # ← template committed to git
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── (protected)/       # Route group — all pages require auth
│   │   │   ├── layout.tsx     # Server component: reads cookie, renders Navbar
│   │   │   ├── dashboard/     # Users list page
│   │   │   ├── datetime/      # Server date/time page
│   │   │   └── query/         # DB query runner page
│   │   ├── login/
│   │   │   └── page.tsx       # Login form (public)
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Redirects / → /login
│   │   └── globals.css        # Tailwind imports + component classes
│   ├── components/
│   │   ├── Navbar.tsx         # Top navigation bar (client component)
│   │   └── JsonViewer.tsx     # Syntax-highlighted JSON viewer
│   ├── lib/
│   │   └── api.ts             # Typed fetch wrapper for all API calls
│   ├── middleware.ts           # Next.js route guard (auth redirect)
│   ├── next.config.js         # API proxy rewrites for development
│   ├── .env.local             # ← your frontend secrets (git-ignored)
│   └── package.json
│
├── nginx/
│   └── app.conf               # Nginx reverse-proxy configuration
├── ecosystem.config.js        # PM2 process definitions
└── README.md
```

---

## 4. Features

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Credential form; on success sets JWT HTTP-only cookie |
| Users | `/dashboard` | Lists all configured users (passwords never exposed) |
| Date & Time | `/datetime` | Fetches current date/time from the server on demand |
| DB Query | `/query` | Enter a query code → backend executes SQL → JSON result |

**Authentication flow:**
1. User submits credentials → `POST /api/auth/login`
2. Backend matches against `USERS` env var
3. On success, a signed JWT is set as an `HttpOnly` cookie
4. All subsequent API calls include the cookie automatically
5. Every protected route validates the JWT via `authMiddleware`
6. Unauthenticated requests receive `401 Unauthorized`

---

## 5. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Express listen port (default: `5000`) |
| `NODE_ENV` | No | `development` or `production` |
| `USERS` | **Yes** | Comma-separated `user:pass` pairs, e.g. `admin:secret,alice:pass2` |
| `JWT_SECRET` | **Yes** | Long random string used to sign JWTs |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `24h`) |
| `DB_SERVER` | **Yes** | MSSQL hostname or IP |
| `DB_PORT` | No | MSSQL port (default: `1433`) |
| `DB_DATABASE` | **Yes** | Database name |
| `DB_USER` | **Yes** | DB username (read-only account recommended) |
| `DB_PASSWORD` | **Yes** | DB password |
| `DB_ENCRYPT` | No | `true` for Azure SQL or TLS connections |
| `DB_TRUST_SERVER_CERT` | No | `true` for self-signed certs (dev only) |
| `FRONTEND_URL` | No | CORS allowed origin (default: `http://localhost:3000`) |

> **Generate a strong JWT secret:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | Server-side URL Next.js rewrites proxy to (e.g. `http://localhost:5000`) |

This variable is **never** sent to the browser — it is only read by the Next.js server
during SSR and the `rewrites()` call in `next.config.js`.

---

## 6. Local Development Setup

### Prerequisites

- **Node.js 20+** — [https://nodejs.org](https://nodejs.org)
- **npm 10+** (comes with Node.js)
- Access to an **MSSQL** instance (optional — app works without DB for auth/users/datetime)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd <repo-folder>

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure backend environment
cp .env.example .env
# Edit .env — set USERS, JWT_SECRET, and DB_* values

# 4. Start the backend (dev mode with auto-reload)
npm run dev
# → Listening on http://localhost:5000

# 5. Open a new terminal, install frontend dependencies
cd ../frontend
npm install

# 6. Configure frontend environment
cp .env.local.example .env.local
# BACKEND_URL=http://localhost:5000  (already set)

# 7. Start the frontend
npm run dev
# → Open http://localhost:3000
```

Login with any `username:password` pair you defined in `USERS`.

---

## 7. API Reference

All protected routes require the JWT cookie (set automatically after login).

### Auth

| Method | Path | Auth | Body / Params | Response |
|--------|------|------|---------------|----------|
| `POST` | `/api/auth/login` | No | `{ username, password }` | `{ message, username }` + sets cookie |
| `POST` | `/api/auth/logout` | No | — | `{ message }` + clears cookie |
| `GET` | `/api/auth/me` | **Yes** | — | `{ username }` |

### Users

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `GET` | `/api/users` | **Yes** | `{ users: [...], total }` |

### Date & Time

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `GET` | `/api/datetime` | **Yes** | `{ iso, utc, date, time, timestamp, timezone }` |

### Database Query

| Method | Path | Auth | Body / Response |
|--------|------|------|-----------------|
| `GET` | `/api/query/codes` | **Yes** | `{ codes: [{ code, preview }] }` |
| `POST` | `/api/query/run` | **Yes** | `{ code }` → `{ code, rowCount, columns, data, executedAt }` |

**Error responses** follow the shape `{ error: "message" }` with appropriate HTTP status codes.

---

## 8. Adding Query Codes

Edit `backend/src/config/queries.json`. Each key is the **code** users type in the UI;
the value is the raw SQL executed against the read-only database.

```json
{
  "GET_TABLES":   "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES",
  "MY_REPORT":    "SELECT TOP 50 col1, col2 FROM dbo.MyView ORDER BY col1",
  "MONTHLY_STATS":"SELECT MONTH(created_at) AS Month, COUNT(*) AS Total FROM dbo.Orders GROUP BY MONTH(created_at)"
}
```

**Rules:**
- Keys are automatically uppercased; the user can type in any case.
- Only `SELECT` statements should be used — the DB user must be read-only.
- Restart the backend after editing the file.

---

## 9. Deploy to AWS EC2

### 9.1 Launch an EC2 Instance

1. Go to **EC2 → Launch Instance** in the AWS Console.
2. Choose **Ubuntu Server 22.04 LTS** (64-bit x86).
3. Instance type: **t3.small** (minimum; t3.medium for better performance).
4. Create or select an existing **key pair** (`.pem` file) for SSH access.
5. Under **Network Settings → Security Group**, add inbound rules:

   | Type | Port | Source |
   |------|------|--------|
   | SSH | 22 | Your IP (not 0.0.0.0/0) |
   | HTTP | 80 | 0.0.0.0/0 |
   | HTTPS | 443 | 0.0.0.0/0 |

6. Storage: **20 GB** gp3 is sufficient.
7. Launch the instance.

### 9.2 Connect to the Instance

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### 9.3 Install System Dependencies

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install curl, git, unzip
sudo apt install -y curl git unzip

# ── Install Node.js 20 via nvm ────────────────────────────────────────────
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc          # or: source ~/.nvm/nvm.sh

nvm install 20
nvm use 20
nvm alias default 20

node -v   # should print v20.x.x
npm -v

# ── Install PM2 globally ──────────────────────────────────────────────────
npm install -g pm2

# ── Install Nginx ─────────────────────────────────────────────────────────
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 9.4 Upload the Project

**Option A — Git (recommended):**
```bash
git clone https://github.com/YOUR_USER/YOUR_REPO.git ~/app
```

**Option B — SCP from your local machine:**
```bash
# Run this on your LOCAL machine
scp -i your-key.pem -r ./Nodejs+NextJs ubuntu@<EC2-IP>:~/app
```

### 9.5 Install Dependencies

```bash
cd ~/app

# Backend
cd backend && npm install --omit=dev
cd ..

# Frontend
cd frontend && npm install --omit=dev
cd ..
```

### 9.6 Configure Environment Files

```bash
# Backend
cp ~/app/backend/.env.example ~/app/backend/.env
nano ~/app/backend/.env
# Set: USERS, JWT_SECRET, DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD, etc.
# Set: NODE_ENV=production
# Set: FRONTEND_URL=http://<YOUR-DOMAIN-OR-IP>

# Frontend
cp ~/app/frontend/.env.local.example ~/app/frontend/.env.local
# BACKEND_URL=http://localhost:5000  (already correct — internal traffic)
```

### 9.7 Build the Frontend

```bash
cd ~/app/frontend
npm run build
# Creates the optimised .next/ build artefacts
```

### 9.8 Create a Logs Directory

```bash
mkdir -p ~/app/logs
```

### 9.9 Start Both Services with PM2

```bash
cd ~/app

# Start using the ecosystem file
pm2 start ecosystem.config.js --env production

# Verify both processes are online
pm2 list

# View live logs
pm2 logs

# Save the process list so PM2 restarts services on reboot
pm2 save

# Register PM2 with systemd (follow the printed command)
pm2 startup
# Copy and run the command that PM2 prints, e.g.:
#   sudo env PATH=... pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 9.10 Configure Nginx

```bash
# Copy the provided Nginx config
sudo cp ~/app/nginx/app.conf /etc/nginx/sites-available/fullstack-app

# Replace placeholder with your actual IP or domain
sudo sed -i 's/YOUR_DOMAIN_OR_IP/<YOUR-EC2-IP-OR-DOMAIN>/g' \
    /etc/nginx/sites-available/fullstack-app

# Enable the site
sudo ln -sf /etc/nginx/sites-available/fullstack-app \
            /etc/nginx/sites-enabled/fullstack-app

# Remove the default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

Your app is now accessible at `http://<EC2-PUBLIC-IP>`.

### 9.11 (Optional) Enable HTTPS with Let's Encrypt

```bash
# Only works if you have a real domain pointing to this EC2 IP
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Follow the prompts — Certbot will auto-update the Nginx config

# Auto-renewal is set up by Certbot; verify with:
sudo systemctl status certbot.timer
```

After SSL is set up, update `backend/.env`:
```
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

Then rebuild and restart:
```bash
cd ~/app/frontend && npm run build
pm2 restart all
```

### 9.12 Useful PM2 Commands

```bash
pm2 list                  # Show all processes
pm2 logs                  # Stream all logs
pm2 logs backend          # Stream backend logs only
pm2 restart all           # Restart everything
pm2 restart backend       # Restart only the backend
pm2 stop all              # Stop all processes
pm2 delete all            # Remove from PM2 registry
pm2 monit                 # Interactive dashboard
```

### 9.13 Updating the Application

```bash
cd ~/app

# Pull latest code
git pull

# Rebuild frontend if it changed
cd frontend && npm install --omit=dev && npm run build && cd ..

# Install any new backend deps
cd backend && npm install --omit=dev && cd ..

# Reload processes (zero-downtime for frontend)
pm2 reload all
```

---

## 10. Security Notes

| Concern | What is done |
|---------|-------------|
| XSS | JWT stored in `HttpOnly` cookie — inaccessible to JavaScript |
| CSRF | `SameSite=Strict` in production prevents cross-site requests |
| Credential exposure | Passwords in `.env` are never sent to the browser or logged |
| Read-only DB | `applicationIntent: 'ReadOnly'` flag + use a DB account with `SELECT` only |
| SQL injection | Query codes map to pre-written SQL — no user input reaches the DB |
| HTTPS | SSL termination at Nginx; use Certbot for free certificates |
| Secrets in git | `.env` and `.env.local` are git-ignored; only `.example` files are committed |

**Before going to production:**
- [ ] Change all passwords in `USERS`
- [ ] Generate a new `JWT_SECRET` (64+ random bytes)
- [ ] Set `DB_TRUST_SERVER_CERT=false` and `DB_ENCRYPT=true` for real DB connections
- [ ] Restrict SSH access to your IP in the EC2 Security Group
- [ ] Enable HTTPS

---

## 11. Troubleshooting

**Login returns 401 even with correct credentials**
→ Check `USERS` format in `backend/.env`: `admin:password,user2:pass2` (no spaces around `:`).

**API calls fail with CORS error in development**
→ Ensure `FRONTEND_URL=http://localhost:3000` in `backend/.env` and that the backend is running on port 5000.

**DB query returns "Database query failed"**
→ Verify all `DB_*` variables in `backend/.env`. Test connectivity:
```bash
cd backend
node -e "require('./src/config/db').getPool().then(() => console.log('OK')).catch(console.error)"
```

**Frontend shows blank page after login**
→ Run `npm run build` in the `frontend` folder and check for TypeScript errors.

**PM2 process crashes on startup**
→ Check logs: `pm2 logs backend --lines 50`

**Nginx returns 502 Bad Gateway**
→ Verify PM2 processes are running: `pm2 list`
→ Check that ports 3000 and 5000 are listening: `ss -tlnp | grep -E '3000|5000'`
