//PROVER
//wallet/key manager
// frontend/src/lib/schnorrClient.ts
import { schnorr } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha256";
//import { hmac } from "@noble/hashes/hmac";
//import { schnorr } from '@noble/curves/secp256k1.js'; //newer than @noble/secp256k1
//import * as bip39 from "bip39";
import { Buffer } from "buffer";
import { hkdf } from "@noble/hashes/hkdf";
//import { randomBytes } from "@noble/hashes/utils";

//polyfill buffer for browser   to use hex conversion
window.Buffer = window.Buffer || Buffer;

//const STORAGE_KEY = "schnorr_priv_key";

////wire up hashing for browser env
//because @noble/secp256k1 v1.7 doesn't support a hasher?
// (secp.utils as any).hmacSha256Sync = (key: Uint8Array, ...msgs: Uint8Array[]) =>
//   hmac(sha256, key, secp.utils.concatBytes(...msgs));

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// (secp.utils as any).sha256Sync = (...msgs: Uint8Array[]) =>
//   sha256(secp.utils.concatBytes(...msgs));

// // export function generateMnemonic(): string {
//   return bip39.generateMnemonic(128);
// }

//
// export async function derivePrivateKey(mnemonic: string, username: string, rpId: string): Promise<string> {
//   const seed = await bip39.mnemonicToSeed(mnemonic);

//   const mix = username + rpId;
//   const mixBytes = new TextEncoder().encode(mix);

//   const privBytes = new Uint8Array(32);
//   for (let i = 0; i < 32; i++) {
//     privBytes[i] = seed[i] ^ (mixBytes[i % mixBytes.length] || 0);
//   }

//   return Buffer.from(privBytes).toString('hex');
// }

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

//
export function getPublicKey(privKeyHex: string): string {
  const privBytes = Buffer.from(privKeyHex, "hex");
  const pubKey = schnorr.getPublicKey(privBytes);
  return toHex(pubKey);
}

//
export async function signMessage(
  privKeyHex: string,
  message: string
): Promise<string> {
  const msgBytes = new TextEncoder().encode(message);

 //const msgHash = sha256(msgBytes);

  const privBytes = Buffer.from(privKeyHex, "hex");

  //HEDGED SIG
  /////const auxRand = randomBytes(32); //auxiliary random bytes
  // only @noble/curves handles the hashing automatically
  const sig = schnorr.sign(msgBytes, privBytes);
  //await secp.schnorr.sign(msgHash, privBytes);
  return toHex(sig);
}

//
// export function storeKey(key: string) { localStorage.setItem(STORAGE_KEY, key); }
// export function loadKey() { return localStorage.getItem(STORAGE_KEY); }
//export function clearKey() { localStorage.removeItem(STORAGE_KEY); }

//get PRF seed from ddevice (raw PRF ArrayBuffer (from webauthn)->hex string)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function prfToSeed(prfResults: any): string {
  if (!prfResults || !prfResults.first) {
    throw new Error(
      "Device did not return a PRF secret. PRF may not be supported."
    );
  }
  return Buffer.from(new Uint8Array(prfResults.first)).toString("hex"); //just use first 32 bytes
}

//derive Schnorr key from PRF seed (HKDF) (deterministic)
export async function deriveKeyFromPrf(
  prfHex: string,
  username: string,
  rpId: string
): Promise<string> {
  //input keying material (IKM): raw PRF output from hardware
  const ikm = new Uint8Array(Buffer.from(prfHex, "hex"));

  const salt = new TextEncoder().encode(username);

  const info = new TextEncoder().encode(`schnorr-passkey-v1|${rpId}`); //context binding string (Relying Party ID + purpose)

  const outputLen = 32; //32 bytes (256 bits): secp256k1 privkey

  //HKDF (RFC 5869)
  // hkdf(hash, ikm, salt, info, length)
  const derivedBytes = hkdf(sha256, ikm, salt, info, outputLen);

  return Buffer.from(derivedBytes).toString("hex");
}
