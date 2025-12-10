import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { derivePrivateKey, signMessage, storeKey } from '../lib/schnorrClient';

interface LoginInitResponse {
  loginId: string;
  challenge: string;
}

interface ApiError {
  response?: { data?: { error?: string } };
  message: string;
}

export default function RecoveryPage() {
  const [username, setUsername] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const { checkSession } = useAuth();

  const doRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Initializing Recovery...');

    try {
      // 1. Init Login (to get the challenge)
      const initRes = await authApi.loginInit(username);
      const { loginId, challenge } = initRes.data as LoginInitResponse;

      // 2. Re-Derive Private Key from Input Mnemonic
      setStatus('Deriving Keys...');
      // Ideally backend sends RP_ID, but for this demo we match the registration logic
      const rpId = window.location.hostname; // or "localhost" if you hardcoded it
      
      const privKey = await derivePrivateKey(mnemonic.trim(), username, rpId);

      // 3. Sign Challenge
      const msg = challenge + "auth" + rpId;
      const sig = await signMessage(privKey, msg);

      // 4. Complete Login
      setStatus('Verifying Proof...');
      await authApi.loginComplete({
        loginId,
        username,
        signature: sig
      });

      // 5. SUCCESS: Store the key on this device for future auto-logins
      storeKey(privKey);
      
      setStatus('Success! Key restored.');
      await checkSession();
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as ApiError;
      setStatus('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <form onSubmit={doRecovery} className="bg-gray-800 p-6 rounded w-full max-w-md">
      <h2 className="text-xl mb-4 text-purple-400">Recover Account</h2>
      <p className="text-sm text-gray-400 mb-4">
        Enter your username and the 12-word phrase you saved during registration.
      </p>
      
      <input 
        className="w-full bg-gray-700 p-2 mb-4 rounded border border-gray-600 focus:border-purple-500 outline-none"
        placeholder="Username" 
        value={username} 
        onChange={e => setUsername(e.target.value)} 
      />
      
      <textarea 
        className="w-full bg-gray-700 p-2 mb-4 rounded border border-gray-600 focus:border-purple-500 outline-none"
        placeholder="enter your 12 mnemonic words here..." 
        rows={3}
        value={mnemonic} 
        onChange={e => setMnemonic(e.target.value)} 
      />

      <button className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded mb-4 transition-colors">
        Recover & Login
      </button>
      
      {status && <div className="text-yellow-400 text-sm mb-4">{status}</div>}

      <div className="text-center text-sm text-gray-500">
        Remembered it? <Link to="/login" className="text-blue-400 hover:underline">Back to Login</Link>
      </div>
    </form>
  );
}