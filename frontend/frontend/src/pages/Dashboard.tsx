import { useAuth } from "../context/AuthContext";

//delete btn
import { authApi, Device } from "../api";
import { useState, useEffect } from "react";
//import { clearKey } from '../lib/schnorrClient';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevs, setLoadingDevs] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const res = await authApi.getDevices();
      setDevices(res.data.devices);
    } catch (err) {
      console.error("Failed to load devices", err);
    } finally {
      setLoadingDevs(false);
    }
  };

  const createBackupLink = async () => {
    try {
      const res = await authApi.initLink();
      setLinkUrl(res.data.url);
    } catch (err) {
      console.error(err);
      alert("Failed to create link");
    }
  };

  const handleRemoveDevice = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to remove "${
          name || "Unknown Device"
        }"?\nYou will no longer be able to login with it.`
      )
    ) {
      return;
    }
    try {
      await authApi.deleteDevice(id);
      // Optimistic update or reload
      setDevices(devices.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete device");
    }
  };

  //handle del
  const handleDeleteAccount = async () => {
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
    <div className="bg-gray-800 p-8 rounded shadow-lg max-w-2xl w-full border border-gray-700">
      <div className="flex justify-between items-start mb-6 border-b border-gray-700 pb-4">
        <div>
          <h2 className="text-2xl text-green-400 font-bold">Dashboard</h2>
          <p className="text-gray-400 mt-1">
            Welcome,{" "}
            <span className="text-white font-mono">{user.username}</span>
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>Member since:</p>
          <p>{new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg text-blue-400 mb-4 font-bold flex items-center">
          Trusted Devices: 
          <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
            {devices.length}
          </span>
        </h3>

        {loadingDevs ? (
          <p className="text-gray-500">Loading devices...</p>
        ) : (
          <div className="space-y-3">
            {devices.map((dev) => (
              <div
                key={dev.id}
                className="bg-gray-900 p-4 rounded border border-gray-700 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-gray-200">
                    {dev.name || "Unnamed Device"}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    ID: {dev.id.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-gray-500">
                    Added: {new Date(dev.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveDevice(dev.id, dev.name)}
                  className="text-red-400 hover:text-red-300 text-sm border border-red-900/50 hover:bg-red-900/20 px-3 py-1 rounded transition-colors"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <h3 className="text-lg text-purple-400 mb-4 font-bold">Actions</h3>

      {!linkUrl ? (
        <button
          onClick={createBackupLink}
          className="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 rounded mb-6 shadow transition-all"
        >
          Add New Device (Create Link)
        </button>
      ) : (
        <div className="bg-gray-900 p-4 rounded mb-6 break-all border border-purple-500 relative">
          <p className="text-xs text-purple-400 mb-2 font-bold uppercase tracking-wider">
            Magic Link Generated
          </p>
          <a
            href={linkUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 text-sm hover:underline block mb-2 font-mono"
          >
            {linkUrl}
          </a>
          <p className="text-xs text-gray-500">
            Open this link on another device to add it to your trusted list.
          </p>
          <button
            onClick={() => setLinkUrl(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-700">
        <button
          onClick={logout}
          className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
        >
          Logout
        </button>

        <button
          onClick={handleDeleteAccount}
          className="bg-red-900/40 hover:bg-red-900/80 text-red-200 border border-red-900 py-2 rounded transition-colors"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
