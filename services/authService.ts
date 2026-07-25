import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import type { User, UserRole } from '@/domain/models';

export class AuthService {
  /**
   * Mengambil data user dari Firestore berdasarkan UID
   */
  static async getUserProfile(uid: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          lastLoginAt: data.lastLoginAt?.toMillis?.() || Date.now(),
          createdAt: data.createdAt?.toMillis?.() || Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Menyinkronkan data Firebase Auth dengan Firestore
   * Jika user baru (via Google), akan membuat dokumen baru dengan role 'viewer' (default)
   */
  static async syncUserToFirestore(firebaseUser: FirebaseUser): Promise<User> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // User baru (Google Sign-In)
      const newUser: Partial<User> = {
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'New User',
        role: 'viewer', // Default role keamanan terendah
        avatarUrl: firebaseUser.photoURL || undefined,
        isActive: true,
      };

      await setDoc(userRef, {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      
      return { id: firebaseUser.uid, ...newUser } as User;
    } else {
      // Update lastLoginAt
      await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
      } as User;
    }
  }

  /**
   * Listener untuk status autentikasi
   */
  static onAuthStateChange(callback: (user: User | null, isLoading: boolean) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User logged in to Firebase Auth, fetch Firestore profile
        const userProfile = await this.getUserProfile(firebaseUser.uid);
        if (userProfile && userProfile.isActive) {
          // Update last login (non-blocking)
          this.syncUserToFirestore(firebaseUser).catch(console.error);
          callback(userProfile, false);
        } else if (userProfile && !userProfile.isActive) {
          // Akun dinonaktifkan
          await signOut(auth);
          callback(null, false);
        } else {
          // Fallback, mungkin belum disinkronisasi
          const newUser = await this.syncUserToFirestore(firebaseUser);
          callback(newUser, false);
        }
      } else {
        // User logged out
        callback(null, false);
      }
    });
  }

  /**
   * Login dengan Google
   */
  static async loginWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return await this.syncUserToFirestore(result.user);
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  }

  /**
   * Login dengan Email/Password
   */
  static async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const profile = await this.getUserProfile(result.user.uid);
      
      if (!profile) {
        throw new Error('Profil pengguna tidak ditemukan di database.');
      }
      
      if (!profile.isActive) {
        await signOut(auth);
        throw new Error('Akun Anda dinonaktifkan. Silakan hubungi Administrator.');
      }
      
      // Update last login
      this.syncUserToFirestore(result.user).catch(console.error);
      
      return profile;
    } catch (error) {
      console.error('Email Sign-In error:', error);
      throw error;
    }
  }

  /**
   * Logout
   */
  static async logout(): Promise<void> {
    return signOut(auth);
  }
}
