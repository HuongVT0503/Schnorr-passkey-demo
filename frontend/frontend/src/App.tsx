import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from "../src/pages/Login";
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import ConnectDevice from './pages/ConnectDevice';
//import RecoveryPage from './pages/Recovery';


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
              
              {/* Default redirect to login */}
              <Route path="/" element={<Navigate to="/login" />} />
            </Route>

            {/* Protected Routes (Dashboard) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/connect-device" element={<ConnectDevice />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

