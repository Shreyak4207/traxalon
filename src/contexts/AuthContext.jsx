// import React, { createContext, useContext, useEffect, useState } from "react";
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged,
// } from "firebase/auth";
// import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
// import { auth, db } from "../firebase/config";

// const AuthContext = createContext();

// export function useAuth() {
//   return useContext(AuthContext);
// }

// export function AuthProvider({ children }) {
//   const [currentUser, setCurrentUser] = useState(null);
//   const [userProfile, setUserProfile] = useState(null);
//   const [loading, setLoading] = useState(true);

//   async function signup(email, password, displayName, badgeId, department) {
//     const { user } = await createUserWithEmailAndPassword(auth, email, password);
//     await setDoc(doc(db, "users", user.uid), {
//       uid: user.uid,
//       email,
//       displayName,
//       badgeId,
//       department,
//       credits: 1,
//       role: "officer",
//       createdAt: serverTimestamp(),
//       lastSeen: serverTimestamp(),
//       totalLinksGenerated: 0,
//     });
//     return user;
//   }

//   async function login(email, password) {
//     const result = await signInWithEmailAndPassword(auth, email, password);
//     await updateDoc(doc(db, "users", result.user.uid), {
//       lastSeen: serverTimestamp(),
//     });
//     return result;
//   }

//   async function logout() {
//     if (currentUser) {
//       await updateDoc(doc(db, "users", currentUser.uid), {
//         lastSeen: serverTimestamp(),
//       });
//     }
//     setUserProfile(null);
//     return signOut(auth);
//   }

//   async function fetchUserProfile(uid) {
//     const docRef = doc(db, "users", uid);
//     const docSnap = await getDoc(docRef);
//     if (docSnap.exists()) {
//       setUserProfile(docSnap.data());
//       return docSnap.data();
//     }
//     return null;
//   }

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       setCurrentUser(user);
//       if (user) {
//         await fetchUserProfile(user.uid);
//         await updateDoc(doc(db, "users", user.uid), {
//           lastSeen: serverTimestamp(),
//         });
//       }
//       setLoading(false);
//     });
//     return unsubscribe;
//   }, []);

//   const value = {
//     currentUser,
//     userProfile,
//     signup,
//     login,
//     logout,
//     fetchUserProfile,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// }


import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
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
    });
    return user;
  }

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await updateDoc(doc(db, "users", result.user.uid), {
      lastSeen: serverTimestamp(),
    });
    return result;
  }

  async function logout() {
    if (currentUser) {
      await updateDoc(doc(db, "users", currentUser.uid), {
        lastSeen: serverTimestamp(),
      });
    }
    setUserProfile(null);
    return signOut(auth);
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
      setCurrentUser(user);

      if (user) {
        await fetchUserProfile(user.uid);
        await updateDoc(doc(db, "users", user.uid), {
          lastSeen: serverTimestamp(),
        });

        // Clear any existing interval
        if (interval) clearInterval(interval);

        // Update lastSeen every 2 minutes while user is on the page
        interval = setInterval(async () => {
          try {
            await updateDoc(doc(db, "users", user.uid), {
              lastSeen: serverTimestamp(),
            });
          } catch (e) {}
        }, 2 * 60 * 1000);

      } else {
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
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}