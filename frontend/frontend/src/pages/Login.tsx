import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { prfToSeed, deriveKeyFromPrf, signMessage } from "../lib/schnorrClient";
import { startAuthentication } from "@simplewebauthn/browser";

//shape of the login init response
interface LoginInitResponse {
  loginId: string;
  challenge: string;
  salt: string;
}

//error shape
interface ApiError {
  response?: { data?: { error?: string } };
  message: string;
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const { checkSession } = useAuth();

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Initializing Login...");

    let privKey: Uint8Array | null = null;

    try {
      //init
      const initRes = await authApi.loginInit(username);
      const { loginId, challenge, salt } = initRes.data as LoginInitResponse;

      setStatus("Veryfying Identity...");

      //WEBAUTHN AUTHENTICATION WITH PRF
      //ask browser to "decrypt" the secret using the same salt
      const authResponse = await startAuthentication({
        optionsJSON: {
          challenge: challenge,
          rpId: window.location.hostname,
          allowCredentials: [], //empty =Discoverable Credential
          userVerification: "required",
          //REQUEST FOR PRF
          extensions: {
            prf: {
              eval: {
                first: new TextEncoder().encode(salt),
              },
            },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });

      //extract seed -> Re-derive PRF key
      const clientExtensionResults = authResponse.clientExtensionResults;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prfResult = (clientExtensionResults as any).prf;

      if (!prfResult || !prfResult.results) {
        throw new Error("Could not recover secret from hardware.");
      }

      //re-derive
      const seedHex = prfToSeed(prfResult.results);
      privKey = await deriveKeyFromPrf(seedHex, salt, window.location.hostname);

      //sign & send
      //matches backend logic (challenge + "auth" + rpId)
      const rpId = window.location.hostname;
      const msg = challenge + "auth" + rpId;
      const sig = await signMessage(privKey, msg);

      //
      setStatus("Wait for Server to Verify Proof...");

      await authApi.loginComplete({
        loginId,
        username,
        signature: sig,
      });

      setStatus("Success!");
      await checkSession(); // Update global context
      navigate("/dashboard");
    } catch (err: unknown) {
      const error = err as ApiError;
      setStatus("Error: " + (error.response?.data?.error || error.message));
    } finally {
      //wipe priv key from memory immediately
      if (privKey) {
        privKey.fill(0);
      }
    }
  };

  return (
    <form
      onSubmit={doLogin}
      className="bg-gray-800 p-6 rounded w-full max-w-md border border-green-900/50"
    >
      <h2 className="text-xl mb-4 text-green-400 font-bold">
        Login (Hardware)
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        Authenticate using your device's biometrics to reconstruct your keys.
      </p>

      <input
        className="w-full bg-gray-700 p-3 mb-4 rounded border border-gray-600 focus:border-green-500 outline-none text-white"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoFocus
      />

      <button className="w-full bg-green-600 hover:bg-green-500 py-3 rounded mb-4 transition-colors font-bold text-white shadow-lg">
        Scan Fingerprint / FaceID
      </button>

      {status && (
        <div className="text-yellow-400 text-sm mb-4 bg-yellow-900/20 p-2 rounded">
          {status}
        </div>
      )}

      <div className="text-center text-sm text-gray-500">
        <div>
          Need an account?{" "}
          <Link to="/register" className="text-blue-400 hover:underline">
            Register
          </Link>
        </div>
      </div>
    </form>
  );
}
