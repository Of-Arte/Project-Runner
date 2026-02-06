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

export interface LeaderboardEntry {
  username: string;
  score: number;
  deviceId: string;
  lastUpdated: number;
}

const LEADERBOARD_COLLECTION = 'leaderboard';

/**
 * Check if a username is available
 */
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  const docRef = doc(db, LEADERBOARD_COLLECTION, username.toLowerCase());
  const docSnap = await getDoc(docRef);
  return !docSnap.exists();
};

/**
 * Register a new user with username and device ID
 */
export const registerUser = async (username: string, deviceId: string): Promise<void> => {
  const normalizedUsername = username.toLowerCase();
  
  // Check if username is available
  const available = await checkUsernameAvailability(normalizedUsername);
  if (!available) {
    throw new Error('Username already taken');
  }

  // Create user document
  await setDoc(doc(db, LEADERBOARD_COLLECTION, normalizedUsername), {
    username: username, // Store original case
    score: 0,
    deviceId,
    lastUpdated: Date.now()
  });
};

/**
 * Submit a score for a user (only if it's higher than current score and deviceId matches)
 */
export const submitScore = async (
  username: string, 
  score: number, 
  deviceId: string
): Promise<void> => {
  const normalizedUsername = username.toLowerCase();
  const docRef = doc(db, LEADERBOARD_COLLECTION, normalizedUsername);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('User not found');
  }

  const userData = docSnap.data() as LeaderboardEntry;

  // Verify device ownership
  if (userData.deviceId !== deviceId) {
    throw new Error('Unauthorized: Device ID mismatch');
  }

  // Only update if new score is higher
  if (score > userData.score) {
    await updateDoc(docRef, {
      score,
      lastUpdated: Date.now()
    });
  }
};

/**
 * Get top N entries from leaderboard
 */
export const getLeaderboard = async (topN: number = 10): Promise<LeaderboardEntry[]> => {
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
