import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authApi } from "../api";
import { startRegistration } from "@simplewebauthn/browser";
import {
  prfToSeed,
  deriveKeyFromPrf,
  getPublicKey,
  signMessage,
} from "../lib/schnorrClient";

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
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [info, setInfo] = useState<{
    username: string;
    challenge: string;
    rpId: string;
    salt: string;
  } | null>(null);

  const [status, setStatus] = useState("Verifying Link...");
  const [error, setError] = useState("");
  const [customName, setCustomName] = useState("");

  const [approvalState, setApprovalState] = useState<"idle" | "waiting">(
    "idle"
  );
  const [myPubKey, setMyPubKey] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid Link");
      return;
    }

    authApi
      .getLinkInfo(token)
      .then((res) => {
        setInfo(res.data);
        setStatus("");
      })
      .catch(() => setError("Link expired or invalid"));
  }, [token]);

  const handleConnect = async () => {
    if (!info || !token) return;
    setStatus("Registering Hardware...");

    const finalName = customName.trim() || getDeviceName();

    let privKey: Uint8Array | null = null;

    try {
      const userIdBytes = new TextEncoder().encode(info.username);

      const newCredential = await startRegistration({
        optionsJSON: {
          challenge: btoa(info.challenge),
          rp: { name: "Schnorr Backup", id: info.rpId },
          user: {
            id: Buffer.from(userIdBytes).toString("base64"),
            name: info.username,
            displayName: info.username,
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          timeout: 60000,
          authenticatorSelection: {
            residentKey: "required",
            userVerification: "required",
          },
          extensions: {
            prf: { eval: { first: new TextEncoder().encode(info.salt) } },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });

      //Derive Keys
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prfResult = (newCredential.clientExtensionResults as any).prf;
      if (!prfResult?.enabled)
        throw new Error("PRF not supported on this device");

      const seedHex = prfToSeed(prfResult.results);
      //derive key using USERNAME from link info to ensure it matches the account
      privKey = await deriveKeyFromPrf(seedHex, info.salt, info.rpId);
      const pubKey = getPublicKey(privKey);

      //Sign Link Proof (Challenge + linkId)
      const msg = info.challenge + token;
      const signature = await signMessage(privKey, msg);

      await authApi.completeLink({
        token,
        newPubKey: pubKey,
        signature,
        challenge: info.challenge,
        deviceName: finalName,
      });

      setMyPubKey(pubKey);
      setApprovalState("waiting");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + err.message);
    } finally {
      if (privKey) {
        privKey.fill(0);
      }
    }
  };

  if (error)
    return (
      <div className="p-8 text-red-500 bg-gray-900 min-h-screen text-center">
        {error}
      </div>
    );
  if (!info)
    return (
      <div className="p-8 text-white bg-gray-900 min-h-screen text-center">
        Loading...
      </div>
    );

  //WAITING FOR APPROVAL
  if (approvalState === "waiting") {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded shadow-lg max-w-md w-full border border-yellow-500 text-center">
          <h2 className="text-2xl text-yellow-400 font-bold mb-4">
            Verification Required
          </h2>
          <p className="text-gray-300 mb-6">
            Please check your main device. Confirm that the fingerprint code
            below matches:
          </p>

          <div className="bg-black p-4 rounded mb-6 border border-gray-700">
            <p className="text-xs text-gray-500 mb-1">DEVICE FINGERPRINT</p>
            <p className="text-2xl font-mono text-yellow-300 tracking-widest break-all">
              {myPubKey.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <p className="text-sm text-gray-400">
            Once approved, you can proceed to login.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded"
          >
            I Have Been Approved &rarr; Login
          </button>
        </div>
      </div>
    );
  }

  //IDLE (INPUT FORM)
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded shadow-lg max-w-md w-full border border-blue-500">
        <h2 className="text-2xl text-white font-bold mb-4">
          Add Backup Device
        </h2>
        <p className="text-gray-300 mb-6">
          Do you want to add this device to the account{" "}
          <strong className="text-blue-400">{info?.username}</strong>?
        </p>

        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">
            Device Name
          </label>
          <input
            type="text"
            className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600 focus:border-blue-500 outline-none"
            placeholder={getDeviceName()}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
        </div>

        {status && (
          <div className="bg-gray-700 p-2 mb-4 text-yellow-300 text-sm rounded">
            {status}
          </div>
        )}

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
