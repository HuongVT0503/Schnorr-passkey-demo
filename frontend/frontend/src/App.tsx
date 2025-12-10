import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from "../src/pages/Login";
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import RecoveryPage from './pages/Recovery';


//wrapper for protected routes
function ProtectedRoute() {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="text-white">Loading session...</div>;
  
  //if not logged in, redirect to login
  return user ? <Outlet /> : <Navigate to="/login" />;
}

//wrapper for public routes (redirect to dashboard if logged in)
function PublicRoute() {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="text-white">Loading...</div>;
  
  return user ? <Navigate to="/dashboard" /> : <Outlet />;
}



export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-900 text-white font-mono p-8 flex flex-col items-center">
          <h1 className="text-3xl mb-8 text-blue-400 font-bold border-b border-blue-400 pb-2">
            SCHNORR PASSKEY DEMO
          </h1>
          
          <Routes>
            {/* Public Routes (Login/Register) */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/recovery" element={<RecoveryPage />} />
              {/* Default redirect to login */}
              <Route path="/" element={<Navigate to="/login" />} />
            </Route>

            {/* Protected Routes (Dashboard) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}











// import React, { useState, useEffect } from 'react';
// import { authApi } from './api';
// import { generateMnemonic, derivePrivateKey, getPublicKey, signMessage, storeKey, loadKey, clearKey } from './lib/schnorrClient';

// //define types for User n Auth responses
// interface UserProfile {
//   username: string;
//   createdAt: string;
// }

// interface RegisterInitResponse {
//   regId: string;
//   rpId: string;
//   challenge: string;
// }

// interface LoginInitResponse {
//   loginId: string;
//   challenge: string;
// }

// interface ApiError {
//   response?: {
//     data?: {
//       error?: string;
//     };
//   };
//   message: string;
// }

// //routes
// type Page = 'login' | 'register' | 'dashboard';

// //form component props
// interface FormProps {
//   onSuccess: () => void;
//   onSwitch: () => void;
// }

// function App() {
//   const [page, setPage] = useState<Page>('login');
//   const [user, setUser] = useState<UserProfile | null>(null);

//   useEffect(() => {
//     //check session 
//     authApi.getMe()
//       .then(res => {
//         setUser(res.data);
//         setPage('dashboard');
//       })
//       .catch(() => setPage('login'));
//   }, []);

//   const handleLogout = () => {
//     //todo: call logout endpoint to clear cookie
//     document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     setUser(null);
//     clearKey(); // ? clear device key
//     setPage('login');
//   };

//   return (
//     <div className="min-h-screen bg-gray-900 text-white font-mono p-8 flex flex-col items-center">
//       <h1 className="text-3xl mb-8 text-blue-400 font-bold border-b border-blue-400 pb-2">SCHNORR PASSKEY DEMO</h1>
      
//       {page === 'login' && (
//         <LoginForm 
//           onSuccess={() => { setPage('dashboard'); window.location.reload(); }} 
//           onSwitch={() => setPage('register')} 
//         />
//       )}
      
//       {page === 'register' && (
//         <RegisterForm 
//           onSuccess={() => setPage('dashboard')} 
//           onSwitch={() => setPage('login')} 
//         />
//       )}
      
//       {page === 'dashboard' && user && (
//         <div className="bg-gray-800 p-8 rounded shadow-lg max-w-md w-full">
//           <h2 className="text-xl text-green-400 mb-4">Access Granted</h2>
//           <div className="mb-4">
//             <p className="text-gray-400">Username:</p>
//             <p className="text-xl">{user.username}</p>
//           </div>
//           <div className="mb-6">
//             <p className="text-gray-400">Account Created:</p>
//             <p className="text-sm">{new Date(user.createdAt).toLocaleString()}</p>
//           </div>
//           <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 py-2 rounded">Logout</button>
//         </div>
//       )}
//     </div>
//   );
// }

// function RegisterForm({ onSuccess, onSwitch }: FormProps) {
//   const [username, setUsername] = useState('');
//   const [status, setStatus] = useState('');
//   const [mnemonic, setMnemonic] = useState('');

//   const doRegister = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setStatus('Initializing Registration...');
    
//     try {
//       //
//       const initRes = await authApi.registerInit(username);
//       //cast the resp data to the interface
//       const { regId, rpId, challenge } = initRes.data as RegisterInitResponse;

//       // client side Crypto?
//       setStatus('Generating Keys...');
//       const newMnemonic = generateMnemonic();
//       setMnemonic(newMnemonic); //show to screen

//       const privKey = await derivePrivateKey(newMnemonic, username, rpId);
//       const pubKey = getPublicKey(privKey);
      
//       // Sign (Challenge + rpId)
//       const msg = challenge + rpId; 
//       const sig = await signMessage(privKey, msg);

//       //
//       setStatus('Finalizing...');
//       await authApi.registerComplete({
//         regId,
//         username,
//         pubKey,
//         regSignature: sig,
//         clientData: { rpId, challenge }
//       });

//       // store key for auto-login later
//       storeKey(privKey);
      
//       alert('Registration Success!');
//       onSuccess();
//     } catch (err: unknown) {
//       const error = err as ApiError;
//       setStatus('Error: ' + (error.response?.data?.error || error.message));
//     }
//   };

//   return (
//     <form onSubmit={doRegister} className="bg-gray-800 p-6 rounded w-full max-w-md">
//       <h2 className="text-xl mb-4">Register New ID</h2>
//       <input 
//         className="w-full bg-gray-700 p-2 mb-4 rounded border border-gray-600 focus:border-blue-500 outline-none"
//         placeholder="Username" 
//         value={username} 
//         onChange={e => setUsername(e.target.value)} 
//       />
//       <button className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded mb-4">Create Passkey</button>
      
//       {status && <div className="text-yellow-400 text-sm mb-4">{status}</div>}
      
//       {mnemonic && (
//         <div className="bg-black p-4 rounded text-xs text-green-400 mb-4 break-words border border-green-800">
//           <p className="font-bold text-white mb-2">SAVE THIS SECRET PHRASE:</p>
//           {mnemonic}
//         </div>
//       )}

//       <div className="text-center text-sm text-gray-500 cursor-pointer hover:text-white" onClick={onSwitch}>
//         Already have an account? Login
//       </div>
//     </form>
//   );
// }

// function LoginForm({ onSuccess, onSwitch }: FormProps) {
//   const [username, setUsername] = useState('');
//   const [status, setStatus] = useState('');

//   const doLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setStatus('Initializing Login...');

//     try {
//       //check local device for key
//       const privKey = loadKey();
//       if (!privKey) throw new Error("No passkey found on this device. (Recovery not implemented in demo)");

//       //
//       const initRes = await authApi.loginInit(username);
//       //cast response data
//       const { loginId, challenge } = initRes.data as LoginInitResponse;

//       // Sign (Challenge + "auth" + rpId)
//       const rpId = "localhost"; 
      
//       const msg = challenge + "auth" + rpId;
//       const sig = await signMessage(privKey, msg);

//       //
//       setStatus('Verifying Proof...');
//       await authApi.loginComplete({
//         loginId,
//         username,
//         signature: sig
//       });

//       setStatus('Success!');
//       onSuccess();
//     } catch (err: unknown) {
//       const error = err as ApiError;
//       setStatus('Error: ' + (error.response?.data?.error || error.message));
//     }
//   };

//   return (
//     <form onSubmit={doLogin} className="bg-gray-800 p-6 rounded w-full max-w-md">
//       <h2 className="text-xl mb-4">Authenticate</h2>
//       <input 
//         className="w-full bg-gray-700 p-2 mb-4 rounded border border-gray-600 focus:border-blue-500 outline-none"
//         placeholder="Username" 
//         value={username} 
//         onChange={e => setUsername(e.target.value)} 
//       />
//       <button className="w-full bg-green-600 hover:bg-green-500 py-2 rounded mb-4">Login with Passkey</button>
      
//       {status && <div className="text-yellow-400 text-sm mb-4">{status}</div>}

//       <div className="text-center text-sm text-gray-500 cursor-pointer hover:text-white" onClick={onSwitch}>
//         Need an account? Register
//       </div>
//     </form>
//   );
// }

// export default App;