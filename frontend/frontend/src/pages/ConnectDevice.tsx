import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { startRegistration } from '@simplewebauthn/browser';
import { prfToSeed, deriveKeyFromPrf, getPublicKey, signMessage } from '../lib/schnorrClient';

const PRF_SALT = "Fixed_Salt_For_Demo"; 

function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Mac/i.test(ua)) return "Mac";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iPhone/iPad";
  if (/Android/i.test(ua)) return "Android Device";
  if (/Linux/i.test(ua)) return "Linux Machine";
  return "Unknown Device";
}

export default function ConnectDevice() {
  const [searchParams] = useSearchParams();
  const linkId = searchParams.get('linkId');
  const navigate = useNavigate();

  const [info, setInfo] = useState<{ username: string; challenge: string; rpId: string } | null>(null);
  const [status, setStatus] = useState("Verifying Link...");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!linkId) { setError("Invalid Link"); return; }
    
    authApi.getLinkInfo(linkId)
      .then(res => {
        setInfo(res.data);
        setStatus("");
      })
      .catch(() => setError("Link expired or invalid"));
  }, [linkId]);

  const handleConnect = async () => {
    if (!info || !linkId) return;
    setStatus("Registering Hardware...");

    try {
      //WebAuthn PRF flow (Identical to Register.tsx)
      const userIdBytes = new TextEncoder().encode(info.username); //dummy id for PRF generation
      //because WebAuthn REQUIRE userID to function, but be isnt sending real db id to fe
      const newCredential = await startRegistration({
        optionsJSON: {
          challenge: btoa(info.challenge), // Base64 challenge
          rp: { name: "Schnorr Backup", id: info.rpId },
          user: { id: Buffer.from(userIdBytes).toString('base64'), name: info.username, displayName: info.username },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
          timeout: 60000,
          authenticatorSelection: { residentKey: "required", userVerification: "required" },
          extensions: { prf: { eval: { first: new TextEncoder().encode(PRF_SALT) } } }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
      });

      //Derive Keys
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prfResult = (newCredential.clientExtensionResults as any).prf;
      if (!prfResult?.enabled) throw new Error("PRF not supported on this device");
      
      const seedHex = prfToSeed(prfResult.results);
      //derive key using USERNAME from link info to ensure it matches the account
      const privKey = await deriveKeyFromPrf(seedHex, info.username, info.rpId);
      const pubKey = getPublicKey(privKey);

      //Sign Link Proof (Challenge + linkId)
      const msg = info.challenge + linkId;
      const signature = await signMessage(privKey, msg);

      await authApi.completeLink({
        linkId,
        newPubKey: pubKey,
        signature,
        challenge: info.challenge,
        deviceName: getDeviceName() 
      });

      alert("Device Connected! You can now log in.");
      navigate("/login");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + err.message);
    }
  };

  if (error) return <div className="p-8 text-red-500 bg-gray-900 min-h-screen text-center">{error}</div>;
  if (!info) return <div className="p-8 text-white bg-gray-900 min-h-screen text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded shadow-lg max-w-md w-full border border-blue-500">
        <h2 className="text-2xl text-white font-bold mb-4">Add Backup Device</h2>
        <p className="text-gray-300 mb-6">
          Do you want to add this device to the account <strong className="text-blue-400">{info.username}</strong>?
        </p>
        
        {status && <div className="bg-gray-700 p-2 mb-4 text-yellow-300 text-sm rounded">{status}</div>}

        <button 
          onClick={handleConnect}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-all"
        >
          Trust This Device
        </button>
      </div>
    </div>
  );
}