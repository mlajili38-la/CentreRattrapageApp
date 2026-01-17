// contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Création du contexte
const AuthContext = createContext();

// Hook personnalisé
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur de AuthProvider');
  }
  return context;
};

// Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fonction pour sauvegarder l'utilisateur dans AsyncStorage
  const saveUserToStorage = async (userData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('isAuthenticated', 'true');
    } catch (storageError) {
      console.error('Erreur lors de la sauvegarde:', storageError);
    }
  };

  // Fonction pour récupérer l'utilisateur depuis AsyncStorage
  const getUserFromStorage = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        return JSON.parse(userString);
      }
    } catch (storageError) {
      console.error('Erreur lors de la récupération:', storageError);
    }
    return null;
  };

  // Fonction pour supprimer l'utilisateur d'AsyncStorage
  const removeUserFromStorage = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('isAuthenticated');
    } catch (storageError) {
      console.error('Erreur lors de la suppression:', storageError);
    }
  };

  // Vérifier si l'utilisateur est déjà connecté au démarrage
  useEffect(() => {
    const checkAuth = async () => {
      if (isLoggingOut) {
        setLoading(false);
        return;
      }

      try {
        const storedUser = await getUserFromStorage();
        
        if (storedUser) {
          setUser(storedUser);
          console.log('✅ Utilisateur restauré depuis AsyncStorage');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'auth:', error);
      } finally {
        setLoading(false);
        console.log('✅ AuthProvider prêt');
      }
    };

    checkAuth();
  }, [isLoggingOut]);

  const login = async (email, password) => {
    try {
      console.log('🔐 Tentative de connexion:', email);
      setLoading(true);
      setError(null);
      
      // Simulation de connexion
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Vérification des identifiants
      let simulatedUser = null;
      
      if (email === 'admin@centre.ma' && password === 'admin123') {
        simulatedUser = {
          email: email,
          uid: 'admin-user-id-123',
          displayName: 'Administrateur Centre',
          role: 'admin',
          timestamp: new Date().toISOString()
        };
        console.log('✅ Connexion ADMIN réussie');
      } else if (email === 'prof.math@centre.ma' && password === 'prof123') {
        simulatedUser = {
          email: email,
          uid: 'teacher-user-id-456',
          displayName: 'Professeur Mathématiques',
          role: 'teacher',
          timestamp: new Date().toISOString()
        };
        console.log('✅ Connexion ENSEIGNANT réussie');
      } else {
        const errorMsg = 'Email ou mot de passe incorrect';
        setError(errorMsg);
        console.log('❌ Échec connexion');
        return { 
          success: false, 
          user: null,
          error: errorMsg
        };
      }

      // Stocker l'utilisateur dans l'état et AsyncStorage
      setUser(simulatedUser);
      setIsLoggingOut(false);
      
      // Sauvegarder dans AsyncStorage
      await saveUserToStorage(simulatedUser);
      
      return { 
        success: true, 
        user: simulatedUser,
        error: null
      };
      
    } catch (error) {
      const errorMsg = 'Erreur de connexion: ' + error.message;
      setError(errorMsg);
      console.log('❌ Erreur connexion:', errorMsg);
      return { 
        success: false, 
        user: null,
        error: errorMsg
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Déconnexion en cours...');
      setIsLoggingOut(true);
      
      // Supprimer d'AsyncStorage
      await removeUserFromStorage();
      
      // Réinitialiser l'état
      setUser(null);
      setError(null);
      
      console.log('✅ Déconnexion réussie');
      return { success: true, error: null };
      
    } catch (error) {
      const errorMsg = 'Erreur lors de la déconnexion';
      setError(errorMsg);
      console.error('❌ Erreur déconnexion:', error);
      return { success: false, error: errorMsg };
    }
  };

  // Fonction pour effacer complètement le stockage (optionnel)
  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.log('🧹 AsyncStorage complètement effacé');
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
    }
  };

  const value = {
    user,
    loading,
    error,
    isLoggingOut,
    login,
    logout,
    clearStorage,
    isAuthenticated: !!user,
    userRole: user?.role || 
              (user?.email?.includes('admin') ? 'admin' : 
               user?.email?.includes('prof') ? 'teacher' : 'student')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;