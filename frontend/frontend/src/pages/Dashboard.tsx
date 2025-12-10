import { useAuth } from '../context/AuthContext';

//delete btn
import { authApi } from '../api';
import { clearKey } from '../lib/schnorrClient';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  //handle del
  const handleDelete = async () => {
    if (!confirm("Are you sure? This will delete your account and private key permanently.")) {
      return;
    }
    try {
      await authApi.deleteAccount();
      clearKey(); //local priv key
      window.location.href = '/login';
    } catch (err) {
      alert("Failed to delete account");
      console.error(err);
    }
    
  };

  if (!user) return null; //should be handled by router protection, but safe guard

  return (
    <div className="bg-gray-800 p-8 rounded shadow-lg max-w-md w-full">
      <h2 className="text-xl text-green-400 mb-4">Access Granted</h2>
      <div className="mb-4">
        <p className="text-gray-400">Username:</p>
        <p className="text-xl">{user.username}</p>
      </div>
      <div className="mb-6">
        <p className="text-gray-400">Account Created:</p>
        <p className="text-sm">{new Date(user.createdAt).toLocaleString()}</p>
      </div>
      <button 
        onClick={logout} 
        className="w-full bg-red-600 hover:bg-red-700 py-2 rounded transition-colors"
      >
        Logout
      </button>

      <button 
          onClick={handleDelete} 
          className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 py-2 rounded transition-colors"
        >
          Delete Account
        </button>
      
    </div>
  );
}