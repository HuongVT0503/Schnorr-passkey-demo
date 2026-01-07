import { useAuth } from "../context/AuthContext";

//delete btn
import { authApi } from "../api";
import { useState } from "react";
//import { clearKey } from '../lib/schnorrClient';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  const createBackupLink = async () => {
    try {
      const res = await authApi.initLink();
      setLinkUrl(res.data.url);
    } catch (err) {
      console.error(err);
      alert("Failed to create link");
    }
  };

  //handle del
  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure? This will delete your account from the server permanently."
      )
    ) {
      return;
    }
    try {
      await authApi.deleteAccount(); //del user from db
      //clearKey(); //local priv key

      window.location.href = "/login";
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

      <hr className="border-gray-700 my-6" />

      {!linkUrl ? (
        <button
          onClick={createBackupLink}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded mb-4"
        >
          Add Backup Device (Create Link)
        </button>
      ) : (
        <div className="bg-gray-900 p-4 rounded mb-4 break-all border border-purple-500">
          <p className="text-xs text-gray-400 mb-2">Open this on your phone:</p>
          <a
            href={linkUrl}
            target="_blank"
            className="text-blue-400 text-sm hover:underline"
          >
            {linkUrl}
          </a>
          <button
            onClick={() => setLinkUrl(null)}
            className="block mt-2 text-xs text-red-400"
          >
            Close
          </button>
        </div>
      )}

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
