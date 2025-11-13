import { schnorr } from "@noble/curves/secp256k1";

//utf8 string to Uint8Array
function utf8ToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

//hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}


//verify a Schnorr sig (BIP340 style) from client
//pubKeyHex: hex-encoded pubkey (from @noble/curves schnorr.getPublicKey)
//message: str that client n server agree on      (e.g challenge + rpId)
//sigHex: hex-encoded sig from schnorr.sign(...)
export function verifySchnorrSignature(
  pubKeyHex: string,
  message: string,
  sigHex: string
): boolean {
  try {
    const msgBytes = utf8ToBytes(message);
    const sigBytes = hexToBytes(sigHex);
    const pubBytes = hexToBytes(pubKeyHex);
    //noble Schnorr can take hex strings for pubKey n sig
    return schnorr.verify(sigBytes, msgBytes, pubBytes);
  } catch (err) {
    console.error("Schnorr verify failed:", err);
    return false;
  }
}
//in backend, call it w the same msg string that frontend signs
//for ex
//registration: challenge + rpId
//login: challenge + "auth" + rpId
