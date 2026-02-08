import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { registerUser } from './leaderboard';

export interface UserProfile {
  uid: string;
  username: string;
  email: string | null;
  highestScore: number;
}

// Convert Firebase User to UserProfile
const getUserProfile = async (user: User): Promise<UserProfile | null> => {
  if (!user) return null;
  
  // Try to get profile from Firestore
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  
  // Fallback if no firestore doc (shouldn't happen with proper flow)
  return {
    uid: user.uid,
    username: user.displayName || 'Unknown Runner',
    email: user.email,
    highestScore: 0
  };
};

export const signUp = async (email: string, password: string, username: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Update Auth Profile
  await updateProfile(user, { displayName: username });
  
  // Create User Document in Firestore
  const userProfile: UserProfile = {
    uid: user.uid,
    username,
    email: user.email,
    highestScore: 0
  };
  
  await setDoc(doc(db, 'users', user.uid), userProfile);
  
  // Create Leaderboard Entry
  await registerUser(username, user.uid);

  return userProfile;
};

export const login = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return getUserProfile(userCredential.user);
};

export const logout = async () => {
  await signOut(auth);
};

export const subscribeToAuth = (callback: (user: UserProfile | null) => void) => {
  if (!auth || !auth.onAuthStateChanged) {
      console.warn("Auth not initialized, defaulting to offline mode.");
      callback(null);
      return () => {};
  }

  // Attempt to set persistence, fallback to memory if blocked
  const setAuthPersistence = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e) {
      console.warn("Local persistence failed (cookies blocked?), falling back to session/memory.", e);
      try {
        await setPersistence(auth, browserSessionPersistence);
      } catch (e2) {
        console.warn("Session persistence failed, falling back to memory.", e2);
        try {
            await setPersistence(auth, inMemoryPersistence);
        } catch (e3) {
            console.error("All persistence methods failed.", e3);
        }
      }
    }
  };
  
  // Fire and forget persistence setup
  setAuthPersistence();

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const profile = await getUserProfile(firebaseUser);
        callback(profile);
      } catch (e) {
        console.error("Error fetching user profile:", e);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};
