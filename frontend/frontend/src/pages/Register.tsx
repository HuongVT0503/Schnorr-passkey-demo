import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
//import { useAuth } from '../context/AuthContext';
import { generateMnemonic, derivePrivateKey, getPublicKey, signMessage, storeKey } from '../lib/schnorrClient';

interface RegisterInitResponse {
  regId: string;
  rpId: string;
  challenge: string;
}

interface ApiError {
  response?: { data?: { error?: string } };
  message: string;
}

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const navigate = useNavigate();
  //const { checkSession } = useAuth();

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Initializing Registration...');
    
    try {
      const initRes = await authApi.registerInit(username);
      const { regId, rpId, challenge } = initRes.data as RegisterInitResponse;

      setStatus('Generating Keys...');
      const newMnemonic = generateMnemonic();
      setMnemonic(newMnemonic);

      const privKey = await derivePrivateKey(newMnemonic, username, rpId);
      const pubKey = getPublicKey(privKey);
      
      const msg = challenge + rpId; 
      const sig = await signMessage(privKey, msg);

      setStatus('Finalizing...');
      await authApi.registerComplete({
        regId,
        username,
        pubKey,
        regSignature: sig,
        clientData: { rpId, challenge }
      });

      storeKey(privKey);
      alert('Registration Success!');
      
      navigate('/login'); 
    } catch (err: unknown) {
      const error = err as ApiError;
      setStatus('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <form onSubmit={doRegister} className="bg-gray-800 p-6 rounded w-full max-w-md">
      <h2 className="text-xl mb-4">Register New ID</h2>
      <input 
        className="w-full bg-gray-700 p-2 mb-4 rounded border border-gray-600 focus:border-blue-500 outline-none"
        placeholder="Username" 
        value={username} 
        onChange={e => setUsername(e.target.value)} 
      />
      <button className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded mb-4 transition-colors">
        Create Passkey
      </button>
      
      {status && <div className="text-yellow-400 text-sm mb-4">{status}</div>}
      
      {mnemonic && (
        <div className="bg-black p-4 rounded text-xs text-green-400 mb-4 break-words border border-green-800 font-mono">
          <p className="font-bold text-white mb-2">SAVE THIS SECRET PHRASE:</p>
          {mnemonic}
        </div>
      )}

      <div className="text-center text-sm text-gray-500">
        Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Login</Link>
      </div>
    </form>
  );
}