# Schnorr Hybrid-Passkey Demo (Monorepo)

**A High-Assurance Authentication Protocol fusing WebAuthn PRF with Schnorr Signatures.**

**Live Demo:** [https://schnorr-passkey-demo-production.up.railway.app](https://schnorr-passkey-demo-production.up.railway.app)

This project demonstrates a cutting-edge "Hybrid" authentication architecture. Instead of storing private keys in vulnerable browser storage (localStorage), it uses the **WebAuthn PRF (Pseudo-Random Function)** extension to derive deterministic Schnorr keys directly from the user's hardware authenticator (Touch ID, Windows Hello, YubiKey).

> **Why this matters:** This allows web apps to perform custom cryptographic operations (like signing Blockchain transactions or end-to-end encrypted messages) while maintaining the seamless UX of a standard Passkey login.

---

## Architecture: The "Hybrid PRF" Flow

Unlike standard WebAuthn (which only validates ownership), this protocol uses the authenticator as a **Hardware Seed Generator**.

### 1. The Math
The Private Key is **never stored on disk**. It is mathematically reconstructed on-demand in memory and wiped immediately after use.

$$
\text{Seed} = \text{Authenticator.PRF}(\text{Salt}, \text{UserBiometrics})
$$

$$
\text{PrivKey} = \text{HKDF}(\text{Seed}, \text{Info} = \text{"schnorr-passkey-v1"})
$$

### 2. The Workflow
1.  **User Trigger:** User clicks "Login" and scans their finger/face.
2.  **Hardware Action:** The Secure Enclave/TPM verifies the biometric and releases a unique PRF Secret to the browser.
3.  **Derivation:** The frontend derives a temporary Schnorr Private Key (secp256k1) from that secret using HKDF.
4.  **Authentication:** The frontend signs a server challenge (`Challenge` + `"auth"` + `RP_ID`) with the Schnorr Key.
5.  **Verification:** The server verifies the Schnorr signature against the registered Public Key.
6.  **Cleanup:** The Private Key is immediately garbage collected from memory.

---

## Key Features

* **Zero-Storage Security:** No private keys are ever stored in `localStorage`, `sessionStorage`, or `IndexedDB`. If a hacker steals the laptop, they cannot steal the key.
* **Multi-Device Support (New):** Securely link backup devices (e.g., add your phone to your account) using a QR-code-based cryptographic handshake.
* **Schnorr Signatures:** Implements BIP-340 compatible signatures (standard for Bitcoin/Nostr) rather than standard ECDSA.
* **Monolithic Deployment:** Single-container deployment architecture where the Node.js backend serves the compiled React frontend.
* **Session Security:** Uses `HttpOnly`, `Secure`, `SameSite=Strict` cookies with IP and User-Agent binding to prevent session hijacking.
* **Auto-Cleanup:** Demo mode automatically purges accounts older than 3 days to maintain database hygiene.

---

## Tech Stack

### Frontend
* **Framework:** React 19 + Vite + TypeScript
* **Cryptography:** `@noble/curves` (Schnorr secp256k1), `@simplewebauthn/browser` (PRF handling)
* **Styling:** TailwindCSS

### Backend
* **Runtime:** Node.js v20 + Express
* **Database:** PostgreSQL 16 (via Docker/Railway)
* **ORM:** Prisma
* **Validation:** Zod

---

## Setup & Installation

### Prerequisites
* Node.js v20+
* Docker & Docker Compose (for local DB)
* Browser: Chrome/Edge (Chromium based). Firefox PRF support is experimental.

### 1. Database Setup
Start the local PostgreSQL container:
```bash
docker-compose up -d
```
*Note: This starts a Postgres instance on port 5435.*

### 2. Install Dependencies
This is a monorepo. You must install dependencies for both backend and frontend.

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend/frontend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `backend/` directory:

```bash
DATABASE_URL="postgresql://huongvt:20225135@localhost:5435/schnorr_passkey?schema=public"
SESSION_SECRET="super-secret-key-at-least-32-chars"
FRONTEND_ORIGIN="http://localhost:5173"
RP_ID="localhost"
PORT=4000
```

### 4. Run Locally (Development Mode)

**Terminal 1 (Backend):**
```bash
cd backend
npx prisma migrate dev  # Initialize DB
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend/frontend
npm run dev
```
Access the app at `http://localhost:5173`.

---

## Production Deployment (Railway)

The project is configured for a **Monolithic Deployment**. The backend compiles the frontend and serves it as static files.

### Build Script
The `package.json` in the backend contains a custom build script that handles the full pipeline:

```json
"build:full": "npm install && npm install --prefix ../frontend/frontend && npm run build --prefix ../frontend/frontend && npm run build && mkdir -p dist/public && cp -r ../frontend/frontend/dist/* dist/public/"
```

**This command:**
1.  Installs backend deps.
2.  Installs frontend deps.
3.  Builds the React frontend (Vite).
4.  Builds the TypeScript backend.
5.  Copies the frontend build artifacts (`dist/`) into the backend's `public` folder.

### Directory Structure
```
/
├── backend/
│   ├── src/
│   │   ├── app.ts        <-- Serves static files from ../public
│   │   └── ...
│   ├── prisma/           <-- Database schema
│   └── package.json      <-- Contains "build:full" script
├── frontend/frontend/
│   ├── src/
│   │   ├── lib/schnorrClient.ts <-- PRF & Key Derivation Logic
│   │   └── ...
│   └── vite.config.ts
└── docker-compose.yml
```

---

## Usage Guide

### 1. Registration
1.  Go to `/register`.
2.  Enter a username.
3.  Browser prompts for biometric auth.
    * **Backend:** Generates a unique salt per user.
    * **Frontend:** Derives key, signs challenge, sends Public Key to server.

### 2. Login
1.  Go to `/login`.
2.  Enter username.
    * **Frontend:** Recovers the specific salt for that user from the server.
    * **Hardware:** Re-derives the same seed using PRF.
    * **Frontend:** Re-creates the Private Key, signs the login challenge, and logs in.

### 3. Multi-Device Linking (Add Backup Device)
1.  Log in on your main device (Desktop).
2.  Go to **Dashboard** -> Click "Add New Device".
3.  A QR code appears containing a secure link token.
4.  Scan this code with a secondary device (e.g., Mobile).
5.  **Mobile:** Authenticates via biometrics to generate a new keypair.
6.  **Mobile:** Signs a proof joining the new key to the account.
7.  **Desktop:** Detects the new device request and you click "Approve".

---

## Limitations & Notes

* **Browser Support:** WebAuthn PRF is a modern standard. It requires Chrome 115+ or Edge. It works best on macOS (Touch ID) and Windows 10/11 (Hello).
* **Network Constraints:** The demo server runs on a free-tier instance; initial spin-up might take 30-60 seconds.
* **Recovery:** This is a self-sovereign model. If you lose all trusted hardware devices, the account is unrecoverable (by design). This is why adding a backup device via the Dashboard is recommended.

---

## Credits
* **Schnorr Logic:** `@noble/curves` (Paul Miller)
* **WebAuthn:** `@simplewebauthn` (Matthew Miller)
* **Developer:** Vu Thuy Huong