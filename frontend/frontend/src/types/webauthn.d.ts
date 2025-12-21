//extend basic credential types (standard WebAuthn types) to support PRF (Pseudo-Random Function)
interface AuthenticationExtensionsClientInputs {
  prf?: {
    eval?: {
      first: Uint8Array;
      second?: Uint8Array;
    };
    evalByCredential?: {
      [credentialId: string]: {
        first: Uint8Array;
        second?: Uint8Array;
      };
    };
  };
}

interface AuthenticationExtensionsClientOutputs {
  prf?: {
    enabled: boolean;
    results?: {
      first: ArrayBuffer;
      second?: ArrayBuffer;
    };
  };
}