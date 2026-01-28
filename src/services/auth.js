// services/auth.js
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './firebase';

export class AuthService {
  // Connexion avec Firebase
  async login(email, password) {
    try {
      console.log('🔥 Tentative de connexion Firebase:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Récupérer les données Firebase
      const firebaseUser = userCredential.user;
      
      // Retourner les données utilisateur
      return {
        success: true,
        user: {
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email,
          role: this.determineRoleFromEmail(firebaseUser.email), // Détermine le rôle
          timestamp: new Date().toISOString()
        },
        error: null
      };
      
    } catch (error) {
      console.log('❌ Erreur Firebase login:', error.code);
      
      // Si Firebase échoue, utiliser les comptes simulés comme fallback
      return this.fallbackLogin(email, password, error);
    }
  }

  // Détermine le rôle basé sur l'email (vous pouvez adapter cette logique)
  determineRoleFromEmail(email) {
    if (email.includes('admin') || email === 'admin@centre.ma') {
      return 'admin';
    } else if (email.includes('prof') || email.includes('teacher')) {
      return 'teacher';
    } else if (email.includes('parent')) {
      return 'parent';
    } else {
      return 'student';
    }
  }

  // Fallback vers l'authentification simulée
  fallbackLogin(email, password, firebaseError) {
    console.log('🔄 Utilisation du fallback simulé...');
    
    // Vos comptes simulés existants
    const simulatedAccounts = {
      'admin@centre.ma': {
        password: 'admin123',
        userData: {
          email: 'admin@centre.ma',
          uid: 'admin-user-id-123',
          displayName: 'Administrateur Centre',
          role: 'admin',
          profilePicture: null,
          timestamp: new Date().toISOString()
        }
      },
      'prof.math@centre.ma': {
        password: 'prof123',
        userData: {
          email: 'prof.math@centre.ma',
          uid: 'teacher-user-id-456',
          displayName: 'Professeur Mathématiques',
          role: 'teacher',
          profilePicture: null,
          subject: 'Mathématiques',
          timestamp: new Date().toISOString()
        }
      },
      'eleve1@gmail.com': {
        password: 'eleve123',
        userData: {
          email: 'eleve1@gmail.com',
          uid: 'student-user-id-789',
          displayName: 'Mohamed Ali',
          role: 'student',
          profilePicture: null,
          studentId: 'STU2024001',
          level: 'Terminale',
          group: 'TS1',
          timestamp: new Date().toISOString()
        }
      }
    };

    // Vérifier si c'est un compte simulé
    if (simulatedAccounts[email] && simulatedAccounts[email].password === password) {
      console.log('✅ Connexion simulée réussie:', email);
      return {
        success: true,
        user: simulatedAccounts[email].userData,
        error: null
      };
    }

    // Si ni Firebase ni le fallback ne fonctionnent
    return {
      success: false,
      user: null,
      error: this.getErrorMessage(firebaseError.code)
    };
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

  // Messages d'erreur
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/invalid-email': 'Email invalide',
      'auth/user-disabled': 'Compte désactivé',
      'auth/user-not-found': 'Aucun compte avec cet email',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/too-many-requests': 'Trop de tentatives, réessayez plus tard',
      'default': 'Email ou mot de passe incorrect'
    };
    
    return errorMessages[errorCode] || errorMessages['default'];
  }
}

const authService = new AuthService();
export default authService;