// screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native'; // AJOUTEZ CET IMPORT
import {Button} from '../components/';
import {InputField} from '../components/';
import {Badge} from '../components/';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = () => { // Retirez navigation des props
  const navigation = useNavigation(); // AJOUTEZ CETTE LIGNE
  const { login, loading, error, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // 🔥 AJOUTEZ CET EFFET POUR LA REDIRECTION
  useEffect(() => {
    console.log('🔍 useEffect - isAuthenticated:', isAuthenticated);
    console.log('🔍 useEffect - user:', user);
    
    if (isAuthenticated && user) {
      console.log('✅ Utilisateur connecté, redirection vers AdminScreen');
      
      // Petit délai pour laisser l'animation se terminer
      setTimeout(() => {
        if (user.role === 'admin' || user.email?.includes('admin')) {
          console.log('🚀 Navigation vers Admin');
          navigation.replace('Admin');
        }
        // Vous pouvez ajouter d'autres redirections ici
      }, 500);
    }
  }, [isAuthenticated, user, navigation]);

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    const errors = {};
    if (!email) errors.email = "L'email est requis";
    if (!password) errors.password = 'Le mot de passe est requis';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ================= LOGIN ================= */
  const handleLogin = async () => {
    if (!validateForm()) return;
    console.log('🔄 Tentative de connexion avec:', email);
    const result = await login(email, password);
    console.log('📊 Résultat login:', result);
  };

  /* ================= REMPLISSAGE DEMO ================= */
  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setFormErrors({});
  };

  // Composant DemoRow
  const DemoRow = ({ role, email, password, onPress }) => (
    <TouchableOpacity
      style={styles.demoRow}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.demoRowHeader}>
        <Ionicons 
          name={role === 'Administrateur' ? 'shield-outline' : 
                role === 'Enseignant' ? 'person-outline' : 'school-outline'} 
          size={20} 
          color="#0014eb" 
          style={{ marginRight: 10 }}
        />
        <Text style={styles.demoRole}>{role}</Text>
      </View>
      <Text style={styles.demoCredentials}>
        {email} / {password}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#eff6ff', '#e0e7ff']}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="school-outline" size={32} color="#fff" />
          </View>
          <Text style={styles.title}>Centre de Rattrapage</Text>
          <Text style={styles.subtitle}>Système de gestion intégré</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion</Text>
            <Text style={styles.cardSubtitle}>
              Connectez-vous à votre espace
            </Text>

            {error && (
              <Badge
                text={error}
                type="danger"
                style={{ marginBottom: 16 }}
              />
            )}

            <InputField
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              error={formErrors.email}
            />

            <InputField
              label="Mot de passe"
              placeholder="********"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={formErrors.password}
            />

            <Button
              title={loading ? 'Connexion...' : 'Se connecter'}
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={{ marginTop: 12 }}
            />

            <View style={styles.separator} />

            <Text style={styles.demoTitle}>Comptes de démonstration</Text>
            
            <DemoRow
              role="Administrateur"
              email="admin@centre.ma"
              password="admin123"
              onPress={() => fillDemoAccount('admin@centre.ma','admin123')}
            />
            <DemoRow
              role="Enseignant"
              email="prof.math@centre.ma"
              password="prof123"
              onPress={() => fillDemoAccount('prof.math@centre.ma', 'prof123')}
            />
            <DemoRow
              role="Élève"
              email="eleve1@gmail.com"
              password="eleve123"
              onPress={() => fillDemoAccount('eleve1@gmail.com', 'eleve123')}
            />
            
            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#0014eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 30,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 28,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 18,
  },
  demoRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  demoRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  demoRole: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  demoCredentials: {
    fontSize: 13,
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default LoginScreen;