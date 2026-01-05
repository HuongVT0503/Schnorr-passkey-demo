
# Schnorr Hybrid-Passkey Demo

**A High-Assurance Authentication Protocol fusing WebAuthn PRF with Schnorr Signatures.**

This project demonstrates a cutting-edge **"Hybrid" authentication architecture**. Instead of storing private keys in vulnerable browser storage (`localStorage`), it uses the **WebAuthn PRF (Pseudo-Random Function)** extension to derive deterministic Schnorr keys directly from the user's hardware authenticator (Touch ID, Windows Hello, YubiKey).

> **Why this matters:** This allows web apps to perform custom cryptographic operations (like signing Blockchain transactions or end-to-end encrypted messages) while maintaining the seamless UX of a standard Passkey login.

---

## Architecture: The "Hybrid PRF" Flow

Unlike standard WebAuthn (which only allows authentication), this protocol uses the authenticator as a **Hardware Seed Generator**.

### The Math
The Private Key is never stored. It is mathematically reconstructed on-demand:

$$\text{Seed} = \text{Authenticator.PRF}(\text{Salt}, \text{UserBiometrics})$$
$$\text{PrivKey} = \text{SHA256}(\text{Seed} + \text{Username} + \text{RP\\_ID})$$

### The Workflow
1.  **User Trigger:** User clicks "Login" and scans their finger/face.
2.  **Hardware Action:** The Secure Enclave/TPM verifies the biometric and releases a unique **PRF Secret** to the browser.
3.  **Derivation:** The frontend derives a temporary **Schnorr Private Key** (secp256k1) from that secret.
4.  **Authentication:** The frontend signs a server challenge with the Schnorr Key.
5.  **Cleanup:** The Private Key is immediately wiped from memory. **Nothing is saved to disk.**

---

## Key Features

* **Zero-Storage Security:** No private keys are ever stored in `localStorage`, `sessionStorage`, or `IndexedDB`. If a hacker steals the laptop, they cannot steal the key.
* **Biometric Native:** Uses native OS authenticators (Touch ID on macOS, Windows Hello, Android Biometrics).
* **Schnorr Signatures:** Implements BIP-340 compatible signatures (standard for Bitcoin/Nostr) rather than standard ECDSA.
* **XSS Resistance:** Even if an attacker injects a script, they cannot extract the key without the user physically touching the sensor at that exact moment.
* **Auto-Cleanup:** Server automatically purges stale accounts after 24 hours (Demo Mode).

---

## Tech Stack

### Frontend
* **Framework:** React 19 + Vite + TypeScript
* **Cryptography:** `@noble/secp256k1` (Schnorr), `@simplewebauthn/browser` (WebAuthn/PRF)
* **Styling:** TailwindCSS

### Backend
* **Runtime:** Node.js + Express
* **Database:** PostgreSQL 16 (via Docker)
* **ORM:** Prisma
* **Validation:** Zod
* **Security:** Helmet, Rate-Limiting, HttpOnly Cookies (JWT)

---

## Setup & Installation

### Prerequisites
* Node.js v18+
* Docker & Docker Compose
* **Browser:** Chrome, Edge, or Safari (macOS Sonoma+). *Firefox PRF support is currently experimental.*
* **Hardware:** A device with a biometric sensor (Touch ID, Windows Hello) or a YubiKey 5 series.

### 1. Database Setup
Start the PostgreSQL container:
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install

# Run Migrations
npx prisma migrate dev --name init

# Start API (Runs on port 4000)
npm run dev
```

### 3. Frontend Setup
Open a new terminal:
```bash
cd frontend/frontend
npm install

# Start Client (Runs on http://localhost:5173)
npm run dev
```
## Usage Guide

### 1. Access: 
Open http://localhost:5173 (Must be localhost or https for WebAuthn to work).

### 2. Registration:

Enter a username.

Click "Create Secure Passkey".

Browser prompt appears: "Verify your identity".

Scan finger. The account is created.

### 3. Login:

Enter the username.

Click "Scan Fingerprint".

The system reconstructs your keys and logs you in.

### 4. Dashboard:

View your session status.

Logout (clears HttpOnly cookie).

Delete Account (wipes data from DB).


## Limitations
## 1. Salt Management: 
This demo uses a fixed salt string. In production, a unique salt should be generated per user and stored in the database to prevent cross-account key collisions.

## 2. Recovery: 
If the hardware authenticator is lost, the account is unrecoverable. Production apps should implement "Multi-Device" PRF sync or a backup recovery key flow.

## Credits 

Schnorr Logic via @noble/secp256k1

WebAuthn Handling via @simplewebauthn

# must demo in lastest Google Chrome version browser, and the windows must have created windows hello. Because WebAuthn PRF is so new, it  is not supported to be sent via QR from another (mobile) device. Also, using Edge instead of Chrome, or an old version of Chrome, may lead to hardware blockage. I know not anyone have a YubiKey, personally I myself don't have one. =))
# will add a fallback safety net purely for the purpose of demostrating the workflow
# RECOMMENDED TO USE WEITH GG PASSKEY AS IT IS MUCH MORE STABLE, ALSO DOESNT LEAVE THE BROWSER
