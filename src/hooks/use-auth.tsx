"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { useToast } from "./use-toast";

type UserRole = "student" | "teacher";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  enrolledCourses: string[];
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let userDocUnsubscribe: () => void = () => {};

    const authStateUnsubscribe = onAuthStateChanged(auth, async (user) => {
      // Clean up previous user's snapshot listener
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }

      setUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        
        // Use onSnapshot for real-time updates
        userDocUnsubscribe = onSnapshot(userDocRef, async (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            setEnrolledCourses(data.enrolledCourseIds || []);
            setRole(data.role || "student");
          } else {
            // If the user doc doesn't exist, create it with a default role
            await setDoc(userDocRef, { role: "student", enrolledCourseIds: [], displayName: user.displayName });
            setEnrolledCourses([]);
            setRole("student");
          }
           setLoading(false);
        }, (error) => {
            console.error("Error listening to user document:", error);
            setLoading(false);
        });

      } else {
        setEnrolledCourses([]);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      authStateUnsubscribe();
      // Ensure the document listener is also cleaned up
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }
    };
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      // Create user document in Firestore
      const userDocRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userDocRef, { displayName: displayName, role: "student", enrolledCourseIds: [] });
      
      setUser({ ...userCredential.user, displayName });
      setRole("student");
      setEnrolledCourses([]);
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      toast({ title: "Çıkış Başarılı", description: "Başarıyla çıkış yaptın" });
    } catch (error) {
       console.error("Sign out error:", error);
       toast({ title: "Sign Out Failed", description: "There was an error signing out.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const value = {
    user,
    role,
    enrolledCourses,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
