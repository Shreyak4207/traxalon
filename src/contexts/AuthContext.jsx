import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, displayName, badgeId, department) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // Send verification email
    await sendEmailVerification(user);

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      displayName,
      badgeId,
      department,
      credits: 1,
      role: "officer",
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      totalLinksGenerated: 0,
      emailVerified: false,
    });
    return user;
  }

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
  
    // Force reload to get fresh emailVerified status
    await result.user.reload();
  
    await setDoc(doc(db, "users", result.user.uid), {
      lastSeen: serverTimestamp(),
    }, { merge: true });
  
    return auth.currentUser; // return fresh user, not cached
  }

  async function logout() {
    if (currentUser) {
      await updateDoc(doc(db, "users", currentUser.uid), {
        lastSeen: null,
      });
    }
    setUserProfile(null);
    return signOut(auth);
  }

  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function fetchUserProfile(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setUserProfile(docSnap.data());
      return docSnap.data();
    }
    return null;
  }

  useEffect(() => {
    let interval = null;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Force reload to get fresh emailVerified status
        await user.reload();
        const freshUser = auth.currentUser;

        setCurrentUser(freshUser);
        await fetchUserProfile(freshUser.uid);
        await setDoc(doc(db, "users", freshUser.uid), {
          lastSeen: serverTimestamp(),
        }, { merge: true });

        if (interval) clearInterval(interval);
        interval = setInterval(async () => {
          try {
            await setDoc(doc(db, "users", freshUser.uid), {
              lastSeen: serverTimestamp(),
            }, { merge: true });
          } catch (e) {}
        }, 2 * 60 * 1000);
      } else {
        setCurrentUser(null);
        if (interval) clearInterval(interval);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    resetPassword,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}