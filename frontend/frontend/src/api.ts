//bridge between frontend n backend

import axios from 'axios';

// centralized API client with interceptors
const api = axios.create({
  baseURL: '/api',      //Proxied by Vite
  withCredentials: true // IMPORTANT: to sends cookies
});

//response interceptor ((global error handling)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    //clean up local user state if 401
    return Promise.reject(error);
  }
);

//define Request Payloads
interface RegisterCompletePayload {
  regId: string;
  username: string;
  pubKey: string;
  regSignature: string;
  clientData: {
    rpId: string;
    challenge: string;
  };
}

interface LoginCompletePayload {
  loginId: string;
  username: string;
  signature: string;
}

export const authApi = {
  // Registration
  registerInit: (username: string) => 
    api.post('/auth/register/init', { username }),
    
  registerComplete: (data: RegisterCompletePayload) => 
    api.post('/auth/register/complete', data),

  // Login
  loginInit: (username: string) => 
    api.post('/auth/login/init', { username }),
    
  loginComplete: (data: LoginCompletePayload) => 
    api.post('/auth/login/complete', data),

  // Session
  getMe: () => api.get('/me'),

  logout: () => api.post('/auth/logout'),

  //delete user
  deleteAccount: () => api.delete('/me'),
  

  //Linking
  initLink: () => api.post('/link/init'), //return{ url, expiresAt }
  
  getLinkInfo: (linkId: string) => api.get(`/link/info/${linkId}`),
  
  completeLink: (data: { linkId: string, newPubKey: string, signature: string, challenge: string, deviceName: string }) => 
    api.post('/link/complete', data),

};