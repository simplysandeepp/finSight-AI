import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);
const USERS_COLLECTION = 'users';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRoleState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(false);

  const loadUserRole = useCallback(async (uid) => {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore timeout')), 5000)
      );
      
      const snapshot = await Promise.race([
        getDoc(userRef),
        timeoutPromise
      ]);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();
      return typeof data.role === 'string' ? data.role : null;
    } catch (error) {
      console.error('Firestore error:', error.message);
      setFirestoreError(true);
      // Return null to allow app to continue
      return null;
    }
  }, []);

  const setUserRole = useCallback(
    async (role) => {
      if (!user) {
        throw new Error('No authenticated user.');
      }

      try {
        const userRef = doc(db, USERS_COLLECTION, user.uid);
        
        // Add timeout for setDoc too
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firestore timeout')), 5000)
        );
        
        const snapshot = await Promise.race([
          getDoc(userRef),
          timeoutPromise
        ]);
        
        const existingData = snapshot.exists() ? snapshot.data() : null;

        const payload = {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          role,
        };

        if (!existingData?.createdAt) {
          payload.createdAt = serverTimestamp();
        }

        await Promise.race([
          setDoc(userRef, payload, { merge: true }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Firestore timeout')), 5000)
          )
        ]);
        
        setUserRoleState(role);
        setFirestoreError(false);
      } catch (error) {
        console.error('Failed to save role to Firestore:', error.message);
        setFirestoreError(true);
        // Still set role locally so user can continue
        setUserRoleState(role);
        throw error;
      }
    },
    [user],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(true);

      if (!nextUser) {
        setUserRoleState(null);
        setLoading(false);
        return;
      }

      (async () => {
        try {
          const role = await loadUserRole(nextUser.uid);
          setUserRoleState(role);
        } catch (error) {
          console.error('Auth state change error:', error);
          setUserRoleState(null);
        } finally {
          setLoading(false);
        }
      })();
    });

    return unsubscribe;
  }, [loadUserRole]);

  const value = useMemo(
    () => ({
      user,
      userRole,
      setUserRole,
      loading,
      firestoreError,
    }),
    [user, userRole, loading, firestoreError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
