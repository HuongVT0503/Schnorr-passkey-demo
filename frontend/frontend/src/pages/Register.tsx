import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
//import { useAuth } from '../context/AuthContext';
import {
  deriveKeyFromPrf,
  getPublicKey,
  signMessage,
  prfToSeed,
} from "../lib/schnorrClient";
import { startRegistration } from "@simplewebauthn/browser";
import { bufferToBase64URLString } from "@simplewebauthn/browser";


interface RegisterInitResponse {
  regId: string;
  rpId: string;
  challenge: string;
  salt: string;
}

interface ApiError {
  response?: { data?: { error?: string } };
  message: string;
}

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  //  const [mnemonic, setMnemonic] = useState('');
  const navigate = useNavigate();
  //const { checkSession } = useAuth();

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Initializing Registration...");

    try {
      //init, get challenge and rpId from be
      const initRes = await authApi.registerInit(username);
      const { regId, rpId, challenge, salt } =
        initRes.data as RegisterInitResponse;

      setStatus("Generating Keys...");

      const userIdBase64 = bufferToBase64URLString(
        new TextEncoder().encode(username).buffer
      );

      //START WEBAUTHN REGISTRATION WITH PRF
      //minimal creation opt obj
      const newCredential = await startRegistration({
        optionsJSON: {
          challenge: challenge, //base64 conversion
          rp: { name: "Schnorr Demo", id: rpId },
          user: {
            id: userIdBase64,
            name: username,
            displayName: username,
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          timeout: 60000,
          authenticatorSelection: {
            residentKey: "required",
            userVerification: "required",
          },
          //ENABLE PRF +++++++++
          extensions: {
            prf: {
              eval: {
                first: new TextEncoder().encode(salt),
              },
            },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      }); ///

      //extract PRF secret (Schnorr Seed)
      const clientExtensionResults = newCredential.clientExtensionResults;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prfResult = (clientExtensionResults as any).prf;

      if (!prfResult || !prfResult.enabled) {
        alert(
          "Your device does not support PRF. Update Chrome or use a newer OS. Try Chrome on macOS (TouchID) or Windows (Hello)."
        );
        throw new Error(
          "Your device does not support PRF. Update Chrome or use a newer OS. Try Chrome on macOS (TouchID) or Windows (Hello)."
        );
      }

      setStatus("Deriving Keys...");

      //raw hardware secret (seed) -> Schnorr keypair
      const seedHex = prfToSeed(prfResult.results);

      const privKey = await deriveKeyFromPrf(seedHex, salt, rpId);
      const pubKey = getPublicKey(privKey);

      const msg = challenge + rpId;
      const sig = await signMessage(privKey, msg);

      setStatus("Finalizing...");

      //send to be
      //be see scnoor pubkey + sig like before, no idea how theyre created
      await authApi.registerComplete({
        regId,
        username,
        pubKey,
        regSignature: sig,
        clientData: { rpId, challenge },
      });

      //storeKey(privKey); XXXXXX
      alert("Registration Success!");

      navigate("/login");
    } catch (err: unknown) {
      console.error(err);
      const error = err as ApiError;
      setStatus("Error: " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <form
      onSubmit={doRegister}
      className="bg-gray-800 p-6 rounded w-full max-w-md border border-blue-900/50"
    >
      <h2 className="text-xl mb-4 text-blue-400 font-bold">
        Register Passkey (PRF)
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        This will create a cryptographic keypair derived from your hardware
        authenticator (TouchID/Windows Hello).
      </p>

      <input
        className="w-full bg-gray-700 p-3 mb-4 rounded border border-gray-600 focus:border-blue-500 outline-none text-white"
        placeholder="Choose a Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoFocus
      />

      <button className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded mb-4 transition-colors font-bold text-white shadow-lg">
        Create Secure Passkey
      </button>

      {status && (
        <div className="text-yellow-400 text-sm mb-4 bg-yellow-900/20 p-2 rounded">
          {status}
        </div>
      )}

      <div className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-400 hover:underline">
          Login
        </Link>
      </div>
    </form>
  );
}
