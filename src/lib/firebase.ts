import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Check if all required Firebase config is present
const firebaseConfig: FirebaseOptions | null = (() => {
  const apiKey = process.env.FIREBASE_API_KEY;
  const authDomain = process.env.FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.FIREBASE_APP_ID;

  // All fields must be non-empty strings
  if (
    apiKey && apiKey.trim() !== '' &&
    authDomain && authDomain.trim() !== '' &&
    projectId && projectId.trim() !== '' &&
    storageBucket && storageBucket.trim() !== '' &&
    messagingSenderId && messagingSenderId.trim() !== '' &&
    appId && appId.trim() !== ''
  ) {
    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    };
  }
  return null;
})();

// Initialize Firebase only if config is complete
let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

if (firebaseConfig) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { auth };
export default app;