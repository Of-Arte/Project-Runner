import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  where
} from 'firebase/firestore';
import { auth } from './firebase';

// Auth is now handled by services/auth.ts
const ensureAuth = async () => {
    // No-op or we can check auth.currentUser
};

export interface LeaderboardEntry {
  username: string;
  score: number;
  uid?: string; // Optional for backward compatibility or public view
  lastUpdated: number;
}

const LEADERBOARD_COLLECTION = 'leaderboard';

/**
 * Check if a username is available
 */
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  await ensureAuth();
  const docRef = doc(db, LEADERBOARD_COLLECTION, username.toLowerCase());
  const docSnap = await getDoc(docRef);
  return !docSnap.exists();
};

/**
 * Register a new user with username and device ID
 */
/**
 * Register a new user - Now handled mostly by Auth Sign Up, but we keep this for creating the Leaderboard Entry
 * specific logic if needed, or we can merge it into services/auth.ts
 * Actually, services/auth.ts signUp creates the 'users' doc.
 * We also need a 'leaderboard' entry if we keep the collections separate.
 * Let's keep them separate for efficient querying (users has PII/email, leaderboard is public).
 */
export const registerUser = async (username: string, uid: string): Promise<void> => {
  // await ensureAuth(); 
  const normalizedUsername = username.toLowerCase();
  
  const available = await checkUsernameAvailability(normalizedUsername);
  if (!available) {
    throw new Error('Username already taken');
  }

  // Create leaderboard document
  await setDoc(doc(db, LEADERBOARD_COLLECTION, normalizedUsername), {
    username: username, 
    score: 0,
    uid, // Bind to Auth UID
    lastUpdated: Date.now()
  });
};

/**
 * Submit a score for a user (only if it's higher than current score and deviceId matches)
 */
/**
 * Submit a score for a user
 */
export const submitScore = async (
  username: string, 
  score: number, 
  // deviceId is deprecated/unused, keeping signature for now or we update calls
): Promise<void> => {
  // await ensureAuth(); // We assume user is signed in via real Auth now
  const user = auth.currentUser;
  if (!user) throw new Error('Must be logged in to submit score');

  const normalizedUsername = username.toLowerCase();
  
  // We can store leaderboard by Username (for uniqueness) but include UID validation
  const docRef = doc(db, LEADERBOARD_COLLECTION, normalizedUsername);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
      const data = docSnap.data();
      // SECURITY CHECK: Ensure the leaderboard entry belongs to this UID
      if (data.uid && data.uid !== user.uid) {
         throw new Error('Unauthorized: Username belongs to another player');
      }
      
      // Update if score is higher
      if (score > data.score) {
        await updateDoc(docRef, {
             score,
             lastUpdated: Date.now(),
             // ensure uid is set (migration for old data if needed, but we prefer fresh start)
             uid: user.uid 
        });
      }
  } else {
      // Should have been created at registration, but lazy create is possible?
      // No, registerUser creates it. But let's be safe.
      await setDoc(docRef, {
          username: username,
          score,
          lastUpdated: Date.now(),
          uid: user.uid
      });
  }
};

/**
 * Get top N entries from leaderboard
 */
export const getLeaderboard = async (topN: number = 10): Promise<LeaderboardEntry[]> => {
  await ensureAuth();
  const q = query(
    collection(db, LEADERBOARD_COLLECTION),
    orderBy('score', 'desc'),
    limit(topN)
  );

  const querySnapshot = await getDocs(q);
  const entries: LeaderboardEntry[] = [];

  querySnapshot.forEach((doc) => {
    entries.push(doc.data() as LeaderboardEntry);
  });

  return entries;
};
