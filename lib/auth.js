import { auth } from "./firebaseClient";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

export { auth };

export const authService = {
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const isAdmin = await authService.verifyAdminStatus(user.uid);
      if (!isAdmin) {
        await authService.logout();
        throw new Error("Access denied: Not an admin.");
      }

      return user;
    } catch (error) {
      throw new Error(authService.getFriendlyErrorMessage(error));
    }
  },

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  },

  async getCurrentUser() {
    return new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      }, reject);
    });
  },

  async verifyAdminStatus(uid) {
    try {
      const response = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid }),
      });
  
      const responseText = await response.text();

      try {
        const data = JSON.parse(responseText);
        return data.isAdmin || false;
      } catch (e) {
        throw new Error('Invalid server response');
      }
    } catch (error) {
      throw new Error(error.message || "Unable to verify admin status");
    }
  },

  getFriendlyErrorMessage(error) {
    const errorMessages = {
      "auth/invalid-credential": "Invalid email or password. Please check your credentials and try again.",
      "auth/invalid-email": "Invalid email format.",
      "auth/user-not-found": "No user found with this email.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/too-many-requests": "Too many failed login attempts. Try again later.",
      "auth/network-request-failed": "Network error. Please check your internet connection.",
    };

    return errorMessages[error.code] || "Authentication failed. Please try again.";
  },
};