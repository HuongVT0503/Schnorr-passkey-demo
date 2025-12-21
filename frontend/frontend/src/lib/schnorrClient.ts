//PROVER
//wallet/key manager
// frontend/src/lib/schnorrClient.ts
import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { hmac } from "@noble/hashes/hmac";
//import { schnorr } from '@noble/curves/secp256k1.js'; //newer than @noble/secp256k1
//import * as bip39 from "bip39";
import { Buffer } from "buffer";



//polyfill buffer for browser   to use hex conversion
window.Buffer = window.Buffer || Buffer;

//const STORAGE_KEY = "schnorr_priv_key";

////wire up hashing for browser env
//because @noble/secp256k1 v1.7 doesn't support a hasher?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(secp.utils as any).hmacSha256Sync = (key: Uint8Array, ...msgs: Uint8Array[]) => 
  hmac(sha256, key, secp.utils.concatBytes(...msgs));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(secp.utils as any).sha256Sync = (...msgs: Uint8Array[]) => 
  sha256(secp.utils.concatBytes(...msgs));

// export function generateMnemonic(): string {
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

//
export function getPublicKey(privKeyHex: string): string {
  const privBytes = Buffer.from(privKeyHex, 'hex');
  const pubKey = secp.schnorr.getPublicKey(privBytes);
  return Buffer.from(pubKey).toString('hex');
}

//
export async function signMessage(privKeyHex: string, message: string): Promise<string> {
  const msgBytes = new TextEncoder().encode(message);
  const privBytes = Buffer.from(privKeyHex, 'hex');

  // only @noble/curves handles the hashing automatically
  const sig = await secp.schnorr.sign(msgBytes, privBytes);
  return Buffer.from(sig).toString('hex');
}

//
// export function storeKey(key: string) { localStorage.setItem(STORAGE_KEY, key); }
// export function loadKey() { return localStorage.getItem(STORAGE_KEY); }
//export function clearKey() { localStorage.removeItem(STORAGE_KEY); }



//get PRF seed from ddevice (raw PRF ArrayBuffer (from webauthn)->hex string)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function prfToSeed(prfResults: any): string {
  if (!prfResults || !prfResults.first) {  
    throw new Error("Device did not return a PRF secret. PRF may not be supported.");
  }
  return Buffer.from(new Uint8Array(prfResults.first)).toString('hex');//just use first 32 bytes
}

//derive Schnorr key from PRF seed (HKDF-style) (deterministic)
export async function deriveKeyFromPrf(prfHex: string, username: string, rpId: string): Promise<string> {
  //input entropy: PRF output (used as entropy) + context (username + rpId)
  const input = prfHex + "_schnorr_passkey_" + username + rpId;
  
  //hash to get 32-byte private key
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hash = await (secp.utils as any).sha256Sync(new TextEncoder().encode(input)); //sha256(new TextEncoder().encode(input));
  
  return Buffer.from(hash).toString('hex');
}