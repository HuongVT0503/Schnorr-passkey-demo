# Schnoor



# Schnorr Passkey Demo

A commercial-grade demonstration of a custom "Passkey-like" authentication protocol implemented using **pure Schnorr Signatures** (BIP-340/secp256k1) rather than standard WebAuthn.

[mimicking WebAuthn, but implemented using pure Schnorr signatures (BIP-340) over the secp256k1 curve.]

This project replaces traditional passwords with cryptographic signatures, featuring mnemonic recovery, secure session management, and automatic data cleanup.

## Architecture

### Tech Stack
* **Backend**: Node.js, Express, TypeScript, PostgreSQL (Prisma).
* **Frontend**: React, Vite, TailwindCSS, Axios.
* **Cryptography**: `@noble/secp256k1` (Schnorr signatures for signing), `bip39` and `@noble/hashes`(PBKDF2/HMAC for Mnemonic generation/ Key Derivation).

### Key Features
1.  **Custom Challenge-Response Auth**: Replaces passwords with cryptographic signatures.
2.  **Mnemonic Recovery**: Users generate a 12-word seed phrase to restore keys on new devices.
3.  **Security Hardening**: HttpOnly cookies, Rate Limiting, Helmet headers, Zod.
4.  **Auto-Cleanup**: User accounts are automatically deleted from the database after **24 hours**.


* **Security Features:**
    * **Helmet:** Secure HTTP headers.
    * **HttpOnly Cookies:** Session management immune to XSS.
    * **Zod:** Strict runtime schema validation.
    * **Rate Limiting:** Protection against brute-force attacks on auth endpoints.


## 🔄 Data Flow & Logic

### 1. Registration (The "Enrollment")
1.  **Init**: Frontend sends `username` to Backend.
2.  **Challenge**: Backend generates a random 32-byte `challenge` (nonce) and stores it temporarily in memory (expires in 5m).
3.  **Key Gen (Frontend)**:
    * Generates a 12-word BIP-39 **Mnemonic** (displayed to user).
    * Derives a **Private Key** using `HMAC-SHA256(Seed, Username + RP_ID)`.
    * Derives the **Public Key**.
4.  **Sign**: Frontend signs `(Challenge + RP_ID)` using the Private Key.
5.  **Verify (Backend)**: Backend verifies the Schnorr signature against the Public Key.
6.  **Store**: If valid, the backend saves the `username` and `publicKey` to PostgreSQL.

### 2. Login (The "Authentication")
1.  **Init**: Frontend sends `username`.
2.  **Challenge**: Backend looks up the user, generates a `challenge`, and sends it back.
3.  **Sign**: Frontend loads the Private Key from `localStorage`.
    * It signs `(Challenge + "auth" + RP_ID)`.
    * *Note: The "auth" string prevents signature replay attacks between registration and login contexts.*
4.  **Verify**: Backend verifies the signature against the stored Public Key in the DB.
5.  **Session**: Backend issues a secure, HTTP-only `session` cookie (JWT).

### 3. Recovery (Device Loss)
1.  User enters `username` and their saved **Mnemonic**.
2.  Frontend re-runs the derivation logic: `HMAC-SHA256(MnemonicSeed, Username + RP_ID)`.
3.  The resulting Private Key is mathematically identical to the original.
4.  Frontend proceeds with the standard Login flow using this restored key.

---


## Prerequisites

* Node.js v18+
* Docker & Docker Compose (for PostgreSQL)

## Setup & Running

1.  **Environment Setup**
    Create a `.env` file in `./backend` (see `.env.example` or use defaults):
    ```bash
    PORT=4000
    DATABASE_URL="postgresql://postgres:password@localhost:5432/schnorr_db?schema=public"
    SESSION_SECRET="super_long_random_secret_string_change_this_in_prod"
    RP_ID="localhost"
    FRONTEND_ORIGIN="http://localhost:5173"
    SESSION_LIFETIME_MS=86400000
    ALLOW_INSECURE_SIGNATURES=0
    ```

2.  **Start Database**
    ```bash
    docker-compose up -d
    ```

3.  **Backend Setup**
    ```bash
    cd backend
    npm install
    
    # Run Migrations (Create db Tables)
    npx prisma migrate dev --name init
    
    # Start API
    npm run dev
    ```
Server runs on port 4000.

4.  **Frontend Setup**
    Open a new terminal.
    ```bash
    cd frontend/frontend
    npm install
    npm run dev
    ```
Client runs on http://localhost:5173

5.  **Access**
    Go to `http://localhost:5173`. 
    
    * **Register:** Enter a username. The browser generates a Schnorr Keypair, signs a challenge, and registers the Public Key with the server.
    * **Login:** Enter the username. The browser signs a new challenge using the stored Private Key. Server validates signature -> Sets HttpOnly Cookie.

## Commercial Considerations & Limitations

* **Key Storage:** This demo uses `localStorage` for private keys. In a banking-grade production environment, keys should be stored in the device's Secure Enclave (via WebAuthn API) or encrypted using a user-derived PIN (PBKDF2/Argon2).
* **KDF:** The current Key Derivation Function is simplified. Production should use standard HKDF.
* **Recovery:** Currently relies on the user saving the mnemonic.


///later uses
docker-compose up -d
cd backend
npm run dev
//check db (inside backend)
npx prisma studio


//fe
cd frontend
cd frontend #critical, because i accidentally made 2 nested frontend folders and dont want to go through the hassle to change them
npm run dev




///npm init -y
C:\Users\ADMIN\source\repos\Schnoor-passkey-demo\backend>npm init -y
Wrote to C:\Users\ADMIN\source\repos\Schnoor-passkey-demo\backend\package.json:

{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "cookie-parser": "^1.4.7",      
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "express-rate-limit": "^8.2.1", 
    "helmet": "^8.1.0"
  },
  "devDependencies": {}
}

//runtime dependencies
///npm install express helmet cors cookie-parser express-rate-limit dotenv

C:\Users\ADMIN\source\repos\Schnoor-passkey-demo\backend>npm install express helmet cors cookie-parser express-rate-limit dotenv

up to date, audited 77 packages in 2s

18 packages are looking for funding 
  run `npm fund` for details        

found 0 vulnerabilities

C:\Users\ADMIN\source\repos\Schnoor-passkey-demo\backend>

///dev dependencies
////npm install -D typescript ts-node-dev @types/node @types/express @types/cookie-parser
C:\Users\ADMIN\source\repos\Schnoor-passkey-demo\backend>npm install -D typescript ts-node-dev @types/node@@types/express @types/cookie-parser  
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated rimraf@2.7.1: Rimraf versions prior to v4 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported

added 73 packages, and audited 150 packages in 8s

26 packages are looking for funding 
  run `npm fund` for details        

found 0 vulnerabilities


//create tsconfig.json
///npx tsc --init
C:\Users\ADMIN\source\repos\Schnoor-passkey-demo\backend>npx tsc --init

Created a new tsconfig.json         
                                 TS 
You can learn more at https://aka.ms/tsconfig





////
C:\Users\ADMIN\source\repos\Schnorr-passkey-demo>node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
2863040a0165fcaf092007e61dd563b6501cce3b98db49734537a5a3ae2c533a
->SESION_SECRET

//robust request validation w Zod