//VERIFIER
//serversidde lib
import { createHash } from "crypto";
import * as secp from "@noble/secp256k1"; //import the whole module// namespace import
//import { schnorr } from "@noble/secp256k1";//named export
//Use the namespace import when you also need other top-level APIs or runtime configuration (for example to set hashes / enable synchronous methods, or to access utils, Point, etc.):
//{schnorr} import would only import schnorr.keygen/sign/verify (async)

//utf8 string to Uint8Array
// function utf8ToBytes(s: string): Uint8Array {
//   return new TextEncoder().encode(s);
// }

// //hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

//verify a Schnorr sig (BIP340 style) from client (64byte)
//pubKeyHex: hex-encoded pubkey (from @noble/curves schnorr.getPublicKey) x-only 32byte hex (64 hex chars) or compressed 33byte hex (66 hex chars)
//message: Uint8Array or str that client n server agree on      (e.g challenge + rpId)   (default utf8 unless messageEncoding="hex")
//sigHex: hex-encoded sig from schnorr.sign(...)
export async function verifySchnorrSignature(
  pubKeyHex: string,
  message: Uint8Array | string,
  sigHex: string
  //messageEncoding: "utf8"|"hex"="utf8"
): Promise<boolean> {
  try {
    // const msgBytes =
    //    typeof message ==="string"? Uint8Array.from(Buffer.from(message, "hex")) : message;
    let msgBytes: Uint8Array; //normalise message to Uint8Array
    if (typeof message === "string") {
      //if (messageEncoding === "hex") {
      //caller explicitly says msg is hex-encoded bytes
      msgBytes = new TextEncoder().encode(message);
    } else {
      //dèault
      //     msgBytes = new TextEncoder().encode(message);
      //   }
      // } else {
      msgBytes = message;
    }
    const msgHashBuffer = createHash("sha256").update(msgBytes).digest();
    const msgHash = new Uint8Array(msgHashBuffer);
    const sigBytes = hexToBytes(sigHex);
    // const pubBytes = hexToBytes(pubKeyHex);
    // if (typeof sigHex !== "string" || sigHex.length < 128) return false;//length 64 bytes->128hex chars

    // // normalise/validate public key:
    // // Accept 64-hex (32 bytes, x-only) or 66-hex (33-byte compressed) and convert to the form noble expects.
    // if (typeof pubKeyHex !== "string") return false;
    // const hlen = pubKeyHex.length;
    // let xOnlyHex: string;
    // if (hlen === 66) {
    //   // 33-byte compressed like 02.. or 03.. -> noble accepts compressed; but Schnorr expects X-only 32 bytes
    //   // Convert compressed to X-only 32 bytes by dropping prefix if prefix == '02' (BIP340 convention) OR decode point and get x.
    //   if (!/^0[23]/.test(pubKeyHex.slice(0,2))) return false;
    //   // drop prefix 02/03 => x-only 32 bytes hex
    //   xOnlyHex = pubKeyHex.slice(2);
    // } else if (hlen === 64) {
    //   // already x-only 32 bytes hex: OK
    //   xOnlyHex = pubKeyHex;
    // } else {
    //   return false;
    // }

    // const pubKeyForVerify = hexToBytes(xOnlyHex);

    // //check curve is valid
    // if (!secp.utils.isValidPublicKey(pubKeyForVerify)) return false;

    let cleanPub = pubKeyHex;
    if (pubKeyHex.length === 66) {
      cleanPub = pubKeyHex.slice(2);
    }

    //noble Schnorr can take hex strings for pubKey n sig
    return await secp.schnorr.verify(sigBytes, msgHash, cleanPub); ////secp.schnorr.verify(sigBytes, msgBytes, pubKeyByte) : all params are Uint8Arrays->match TS type
  } catch (err) {
    console.error("Schnorr verify failed:", err);
    return false;
  }
}
//in backend, call it w the same msg string that frontend signs
//for ex
//registration: challenge + rpId
//login: challenge + "auth" + rpId
