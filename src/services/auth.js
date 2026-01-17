// src/services/auth.js
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './firebase';

export class AuthService {
  // Connexion avec email/mot de passe
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: userCredential.user,
        error: null
      };
    } catch (error) {
      console.log('Erreur Firebase login:', error.code, error.message);
      return {
        success: false,
        user: null,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Déconnexion
  async logout() {
    try {
      await signOut(auth);
      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur lors de la déconnexion'
      };
    }
  }

  // Vérifier si l'utilisateur est connecté
  getCurrentUser() {
    return auth.currentUser;
  }

  // Écouter les changements d'authentification
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Messages d'erreur traduits
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/invalid-email': 'Email invalide',
      'auth/user-disabled': 'Compte désactivé',
      'auth/user-not-found': 'Aucun compte avec cet email',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/too-many-requests': 'Trop de tentatives, réessayez plus tard',
      'auth/network-request-failed': 'Erreur réseau',
      'auth/invalid-credential': 'Identifiants incorrects',
      'auth/operation-not-allowed': 'Méthode de connexion non activée',
      'default': `Erreur: ${errorCode || 'inconnue'}`
    };
    
    return errorMessages[errorCode] || errorMessages['default'];
  }
}

// Crée et exporte une instance unique
const authService = new AuthService();
export default authService;