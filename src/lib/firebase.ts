import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  onSnapshot,
  getDocFromServer
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Firestore Standard Error Handling conforms strictly with the FirestoreErrorInfo constraint.
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Global instances
let _app: any = null;
let _auth: any = null;
let _db: any = null;
let _isLocalFallback = false;

try {
  // Let's check if we have a real config vs dummy. If it's the dummy compile key or hits errors,
  // we can flag as local fallback.
  if (firebaseConfig.apiKey.includes("FAKE_KEY_FOR_LOCAL_COMPILATION_ONLY")) {
    _isLocalFallback = true;
    console.warn("Firebase config has mock values. Falling back to secure localStorage mode.");
  } else {
    _app = initializeApp(firebaseConfig);
    // Explicit firestore instantiation with dataset ID is mandatory as per skill instructions
    _db = getFirestore(_app, firebaseConfig.firestoreDatabaseId);
    _auth = getAuth(_app);

    // Test firestore connection as instructed by guidelines
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(_db, 'test', 'connection'));
      } catch (error: any) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. Client is offline");
        }
      }
    };
    testConnection();
  }
} catch (e) {
  console.error("Failed to initialize Firebase SDK, using robust local persistence engine instead:", e);
  _isLocalFallback = true;
}

export const app = _app;
export const db = _db;
export const auth = _auth;
export const isLocalFallback = _isLocalFallback;

// Wrapper Error Handler conforming to the absolute mandate of Phase 3 Error Handling
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: _auth?.currentUser?.uid || null,
      email: _auth?.currentUser?.email || null,
      emailVerified: _auth?.currentUser?.emailVerified || null,
      isAnonymous: _auth?.currentUser?.isAnonymous || null,
      tenantId: _auth?.currentUser?.tenantId || null,
      providerInfo: _auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Google Pop-up Authenticater
export async function signInWithGoogle(): Promise<User | null> {
  if (_isLocalFallback || !_auth) {
    // Generate a beautiful mock user in fallback mode
    const fakeUser = {
      uid: "nextray-local-developer",
      email: "guest@nextray.ai",
      displayName: "Guest Explorer",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    } as any;
    localStorage.setItem("nextray_local_user", JSON.stringify(fakeUser));
    return fakeUser;
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(_auth, provider);
    return result.user;
  } catch (error) {
    console.error("OAuth sign in popup error:", error);
    return null;
  }
}

// Email & Password Auth: Sign Up
export async function signUpEmail(email: string, password: string, displayName: string): Promise<User> {
  if (!_auth) {
    throw new Error("Auth service is not initialized");
  }
  const credential = await createUserWithEmailAndPassword(_auth, email, password);
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  return credential.user;
}

// Email & Password Auth: Sign In
export async function signInEmail(email: string, password: string): Promise<User> {
  if (!_auth) {
    throw new Error("Auth service is not initialized");
  }
  const credential = await signInWithEmailAndPassword(_auth, email, password);
  return credential.user;
}

// Sign-out
export async function logoutUser(): Promise<void> {
  if (_isLocalFallback || !_auth) {
    localStorage.removeItem("nextray_local_user");
    return;
  }
  await signOut(_auth);
}
export { onAuthStateChanged };
