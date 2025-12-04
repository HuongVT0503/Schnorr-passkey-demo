// frontend/src/lib/schnorrClient.ts
import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { hmac } from "@noble/hashes/hmac";
//import { schnorr } from '@noble/curves/secp256k1.js'; //newer than @noble/secp256k1
import * as bip39 from "bip39";
import { Buffer } from "buffer";


//wire up hashing for browser env
//because @noble/secp256k1 v1.7 doesn't support a hasher?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(secp.utils as any).hmacSha256Sync = (key: Uint8Array, ...msgs: Uint8Array[]) => 
  hmac(sha256, key, secp.utils.concatBytes(...msgs));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(secp.utils as any).sha256Sync = (...msgs: Uint8Array[]) => 
  sha256(secp.utils.concatBytes(...msgs));

//polyfill buffer for the browser   to use hex conversion
window.Buffer = window.Buffer || Buffer;

const STORAGE_KEY = "schnorr_priv_key";

//
export function generateMnemonic(): string {
  return bip39.generateMnemonic(128); 
}

//
export async function derivePrivateKey(mnemonic: string, username: string, rpId: string): Promise<string> {
  const seed = await bip39.mnemonicToSeed(mnemonic); 

  const mix = username + rpId;
  const mixBytes = new TextEncoder().encode(mix);

  const privBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    privBytes[i] = seed[i] ^ (mixBytes[i % mixBytes.length] || 0);
  }

  return Buffer.from(privBytes).toString('hex');
}

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
export function storeKey(key: string) { localStorage.setItem(STORAGE_KEY, key); }
export function loadKey() { return localStorage.getItem(STORAGE_KEY); }
export function clearKey() { localStorage.removeItem(STORAGE_KEY); }