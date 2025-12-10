import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { loadKey, signMessage } from "../lib/schnorrClient";

//shape of the login init response
interface LoginInitResponse {
  loginId: string;
  challenge: string;
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

    try {
      const privKey = loadKey();
      if (!privKey) throw new Error("No passkey found on this device.");

      //init
      const initRes = await authApi.loginInit(username);
      const { loginId, challenge } = initRes.data as LoginInitResponse;

      //sign
      //matches backend logic (challenge + "auth" + rpId)
      const rpId = window.location.hostname;
      const msg = challenge + "auth" + rpId;
      const sig = await signMessage(privKey, msg);

      //
      setStatus("Verifying Proof...");
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
    }
  };

  return (
    <form
      onSubmit={doLogin}
      className="bg-gray-800 p-6 rounded w-full max-w-md"
    >
      <h2 className="text-xl mb-4">Authenticate</h2>
      <input
        className="w-full bg-gray-700 p-2 mb-4 rounded border border-gray-600 focus:border-blue-500 outline-none"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button className="w-full bg-green-600 hover:bg-green-500 py-2 rounded mb-4 transition-colors">
        Login with Passkey
      </button>

      {status && <div className="text-yellow-400 text-sm mb-4">{status}</div>}

      <div className="text-center text-sm text-gray-500">
        <div>
          Need an account?{" "}
          <Link to="/register" className="text-blue-400 hover:underline">
            Register
          </Link>
        </div>

        <div>
          Lost your device?{" "}
          <Link to="/recovery" className="text-blue-400 hover:underline">
            Recover Account
          </Link>
        </div>
      </div>
    </form>
  );
}
