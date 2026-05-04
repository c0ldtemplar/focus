export const isFirebaseConfigured = !!(process.env.FIREBASE_API_KEY && process.env.FIREBASE_API_KEY !== 'your_firebase_api_key');

export const DUMMY_USERS = [
  { id: '1', email: 'test@focus.local', password: 'test123', name: 'Usuario Prueba' },
  { id: '2', email: 'demo@focus.local', password: 'demo123', name: 'Demo Usuario' },
];