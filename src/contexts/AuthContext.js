// contexts/AuthContext.js - VERSION AVEC SUPPORT ENSEIGNANTS
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérifier l'état d'authentification au démarrage
  useEffect(() => {
    console.log('🔍 Initialisation AuthProvider...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', firebaseUser?.email);
      
      if (firebaseUser) {
        try {
          // Chercher l'utilisateur dans Firestore par email
          let userData = {
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || firebaseUser.email,
            role: 'student', // Par défaut
            timestamp: new Date().toISOString()
          };
          
          // 1. Chercher dans la collection 'teachers' par email
          const teachersQuery = query(
            collection(db, 'teachers'),
            where('email', '==', firebaseUser.email)
          );
          const teachersSnapshot = await getDocs(teachersQuery);
          
          // Dans AuthContext.js, modifiez la partie teachers
if (!teachersSnapshot.empty) {
  console.log('👨‍🏫 Enseignant trouvé dans Firestore');
  teachersSnapshot.forEach((doc) => {
    const teacherData = doc.data();
    
    // RÉCUPÉRER L'UID DU DOCUMENT OU UTILISER L'UID FIREBASE
    const teacherUid = teacherData.uid || firebaseUser.uid;
    
    userData = {
      ...userData,
      ...teacherData,
      role: 'teacher',
      teacherId: doc.id, // CORRECT: C'est T1, T2, etc.
      uid: firebaseUser.uid, // Garder l'UID Firebase
      firestoreId: doc.id,
      displayName: teacherData.name || teacherData.displayName || firebaseUser.email
    };
    
    console.log('📋 Données teacher:', {
      teacherId: doc.id,
      uid: teacherUid,
      name: teacherData.name
    });
  });
}
          // 2. Si pas enseignant, chercher dans 'students'
          else {
            const studentsQuery = query(
              collection(db, 'students'),
              where('email', '==', firebaseUser.email)
            );
            const studentsSnapshot = await getDocs(studentsQuery);
            
            if (!studentsSnapshot.empty) {
              console.log('🎓 Étudiant trouvé dans Firestore');
              studentsSnapshot.forEach((doc) => {
                const studentData = doc.data();
                userData = {
                  ...userData,
                  ...studentData,
                  role: 'student',
                  studentId: doc.id, // S1, S2, S3, etc.
                  firestoreId: doc.id
                };
              });
            }
            // 3. Chercher dans 'users' par email (collection générique)
            else {
              const usersQuery = query(
                collection(db, 'users'),
                where('email', '==', firebaseUser.email)
              );
              const usersSnapshot = await getDocs(usersQuery);
              
              if (!usersSnapshot.empty) {
                console.log('👤 Utilisateur trouvé dans collection users');
                usersSnapshot.forEach((doc) => {
                  const userDocData = doc.data();
                  userData = {
                    ...userData,
                    ...userDocData,
                    firestoreId: doc.id
                  };
                  
                  if (userDocData.linkedId && userDocData.role === 'student') {
                    userData.studentId = userDocData.linkedId;
                  }
                  if (userDocData.linkedId && userDocData.role === 'teacher') {
                    userData.teacherId = userDocData.linkedId;
                  }
                });
              }
            }
          }
          
          // 4. Vérifier si c'est un admin
          const adminEmails = [
            'admin@excellence-sayada.ma', 
            'admin@centre.ma',
            'admin@example.com'
          ];
          
          if (adminEmails.includes(firebaseUser.email)) {
            userData.role = 'admin';
            console.log('👑 Utilisateur détecté comme admin');
          }
          
          // 5. Fallback pour les comptes de démonstration
          if (!userData.studentId && !userData.teacherId) {
            const demoAccounts = {
              // Comptes enseignants de démonstration
              'prof.math@centre.ma': { 
                role: 'teacher', 
                teacherId: 'T1', 
                name: 'Ahmed Bennani',
                specialization: 'Mathématiques'
              },
              'prof.physics@centre.ma': { 
                role: 'teacher', 
                teacherId: 'T2', 
                name: 'Fatima Zohra',
                specialization: 'Physique'
              },
              // Comptes étudiants de démonstration
              'sara.alami@gmail.com': { 
                role: 'student', 
                studentId: 'S1', 
                name: 'Sara Alami',
                levelCode: '1ERE-SEC'
              },
              'mohammed.chraibi@gmail.com': { 
                role: 'student', 
                studentId: 'S2', 
                name: 'Mohammed Chraibi',
                levelCode: '2BAC-SCIENCES'
              },
              'eleve1@gmail.com': { 
                role: 'student', 
                studentId: 'S1', 
                name: 'Sara Alami',
                levelCode: '1ERE-SEC'
              }
            };
            
            if (demoAccounts[firebaseUser.email]) {
              userData = {
                ...userData,
                ...demoAccounts[firebaseUser.email]
              };
              console.log(`🎭 Utilisation données démo pour: ${firebaseUser.email}`);
            }
          }
          
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          console.log('✅ Utilisateur connecté:', {
            role: userData.role,
            email: userData.email,
            id: userData.studentId || userData.teacherId || userData.firestoreId
          });
          
        } catch (error) {
          console.error('❌ Erreur chargement données utilisateur:', error);
        }
      } else {
        // Aucun utilisateur Firebase connecté
        setUser(null);
        await AsyncStorage.removeItem('user');
        console.log('🚫 Aucun utilisateur connecté');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Login avec Firebase
  const login = async (email, password) => {
    try {
      console.log('🔐 Tentative de connexion:', email);
      setLoading(true);
      setError(null);
      
      // 1. Authentification Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log('✅ Firebase auth réussie:', firebaseUser.uid);
      
      // 2. Chercher l'utilisateur dans Firestore
      let userData = {
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || firebaseUser.email,
        role: 'student',
        timestamp: new Date().toISOString()
      };
      
      // Chercher dans 'teachers' par email (priorité aux enseignants)
      const teachersQuery = query(
        collection(db, 'teachers'),
        where('email', '==', email)
      );
      const teachersSnapshot = await getDocs(teachersQuery);
      
      if (!teachersSnapshot.empty) {
        console.log('👨‍🏫 Enseignant trouvé dans Firestore');
        teachersSnapshot.forEach((doc) => {
          const teacherData = doc.data();
          userData = {
            ...userData,
            ...teacherData,
            role: 'teacher',
            teacherId: doc.id,
            firestoreId: doc.id
          };
        });
      } 
      // Chercher dans 'students' par email
      else {
        const studentsQuery = query(
          collection(db, 'students'),
          where('email', '==', email)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        
        if (!studentsSnapshot.empty) {
          console.log('🎓 Étudiant trouvé dans Firestore');
          studentsSnapshot.forEach((doc) => {
            const studentData = doc.data();
            userData = {
              ...userData,
              ...studentData,
              role: 'student',
              studentId: doc.id,
              firestoreId: doc.id
            };
          });
        } 
        // Chercher dans 'users' par email
        else {
          const usersQuery = query(
            collection(db, 'users'),
            where('email', '==', email)
          );
          const usersSnapshot = await getDocs(usersQuery);
          
          if (!usersSnapshot.empty) {
            console.log('👤 Utilisateur trouvé dans collection users');
            usersSnapshot.forEach((doc) => {
              const userDocData = doc.data();
              userData = {
                ...userData,
                ...userDocData,
                firestoreId: doc.id
              };
              
              if (userDocData.linkedId && userDocData.role === 'student') {
                userData.studentId = userDocData.linkedId;
              }
              if (userDocData.linkedId && userDocData.role === 'teacher') {
                userData.teacherId = userDocData.linkedId;
              }
            });
          }
        }
      }
      
      // 3. Vérifier si c'est un admin
      const adminEmails = [
        'admin@excellence-sayada.ma', 
        'admin@centre.ma',
        'admin@example.com'
      ];
      
      if (adminEmails.includes(email)) {
        userData.role = 'admin';
        console.log('👑 Utilisateur défini comme admin');
      }
      
      // 4. Fallback pour les comptes de démonstration
      if (!userData.studentId && !userData.teacherId) {
        const demoAccounts = {
          // Comptes enseignants de démonstration
          'ahmed.bennani@centre.ma': { 
            role: 'teacher', 
            teacherId: 'T1', 
            name: 'Ahmed Bennani',
            specialization: 'Mathématiques',
            phone: '+216 73 452 100'
          },
          'prof.physics@centre.ma': { 
            role: 'teacher', 
            teacherId: 'T2', 
            name: 'Fatima Zohra',
            specialization: 'Physique',
            phone: '+216 73 452 101'
          },
          'prof.sciences@centre.ma': { 
            role: 'teacher', 
            teacherId: 'T3', 
            name: 'Karim Alami',
            specialization: 'Sciences',
            phone: '+216 73 452 102'
          },
          // Comptes étudiants de démonstration
          'sara.alami@gmail.com': { 
            role: 'student', 
            studentId: 'S1', 
            name: 'Sara Alami',
            levelCode: '1ERE-SEC',
            parentPhone: '+216 73 452 001'
          },
          'mohammed.chraibi@gmail.com': { 
            role: 'student', 
            studentId: 'S2', 
            name: 'Mohammed Chraibi',
            levelCode: '2BAC-SCIENCES',
            parentPhone: '+216 73 452 002'
          },
          'eleve1@gmail.com': { 
            role: 'student', 
            studentId: 'S1', 
            name: 'Sara Alami',
            levelCode: '1ERE-SEC',
            parentPhone: '+216 73 452 001'
          }
        };
        
        if (demoAccounts[email]) {
          userData = {
            ...userData,
            ...demoAccounts[email]
          };
          console.log(`🎭 Utilisation données démo pour: ${email}`);
        }
      }
      
      // Mettre à jour l'état
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      console.log('✅ Login réussi:', {
        role: userData.role,
        name: userData.name,
        id: userData.studentId || userData.teacherId
      });
      
      return { 
        success: true, 
        user: userData,
        error: null
      };
      
    } catch (error) {
      console.log('❌ Erreur Firebase login:', error.code);
      
      // Gestion des erreurs
      const errorMsg = getErrorMessage(error.code) || 'Email ou mot de passe incorrect';
      setError(errorMsg);
      
      return { 
        success: false, 
        user: null,
        error: errorMsg
      };
      
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      console.log('🚪 Déconnexion...');
      await signOut(auth);
      setUser(null);
      await AsyncStorage.removeItem('user');
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

  // Messages d'erreur
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/invalid-email': 'Email invalide',
      'auth/user-disabled': 'Compte désactivé',
      'auth/user-not-found': 'Aucun compte avec cet email',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/too-many-requests': 'Trop de tentatives',
      'default': 'Erreur de connexion'
    };
    
    return errorMessages[errorCode] || errorMessages['default'];
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    userRole: user?.role,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    isTeacher: user?.role === 'teacher'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;