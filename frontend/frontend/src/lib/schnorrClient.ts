// frontend/src/lib/schnorrClient.ts
import { schnorr } from '@noble/curves/secp256k1.js'; //newer than @noble/secp256k1
import * as bip39 from "bip39";
import { Buffer } from "buffer";

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
  const pubKey = schnorr.getPublicKey(privBytes);
  return Buffer.from(pubKey).toString('hex');
}

//
export async function signMessage(privKeyHex: string, message: string): Promise<string> {
  const msgBytes = new TextEncoder().encode(message);
  const privBytes = Buffer.from(privKeyHex, 'hex');

  // @noble/curves handles the hashing automatically
  const sig = await schnorr.sign(msgBytes, privBytes);
  return Buffer.from(sig).toString('hex');
}

//
export function storeKey(key: string) { localStorage.setItem(STORAGE_KEY, key); }
export function loadKey() { return localStorage.getItem(STORAGE_KEY); }
export function clearKey() { localStorage.removeItem(STORAGE_KEY); }