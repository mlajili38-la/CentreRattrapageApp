// App.js
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, Text, Alert } from 'react-native';
import { Button, InputField, Card, StatCard, Badge, SessionPicker } from './src/components';
import { theme } from './src/constants';

export default function App() {
  const handlePress = (message) => {
    Alert.alert('Action', `Bouton pressé: ${message}`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Centre de Rattrapage</Text>
        <Text style={styles.subtitle}>Système de gestion intégré</Text>
      </View>

      {/* FORMULAIRE DE CONNEXION */}
      <Card title="Connexion" style={styles.section}>
        <Text style={styles.sectionDescription}>
          Connectez-vous à votre espace
        </Text>
        
        <InputField
          label="Email"
          placeholder="votre@email.com"
          
          onChangeText={(text) => console.log('Email:', text)}
          style={styles.inputSpacing}
        />
        
        <InputField
          label="Mot de passe"
          placeholder="........"
          secureTextEntry
          onChangeText={(text) => console.log('Password:', text)}
          style={styles.inputSpacing}
        />
        
        <Button
          title="Se connecter"
          onPress={() => handlePress("Connexion")}
          style={styles.buttonSpacing}
        />
      </Card>

      {/* COMPTES DE DÉMONSTRATION */}
      <Card title="Comptes de démonstration" style={styles.section}>
        <View style={styles.demoAccount}>
          <Text style={styles.demoRole}>👑 Administrateur</Text>
          <Text style={styles.demoCredentials}>admin@centre.ma</Text>
          <Text style={styles.demoPassword}>Mot de passe: admin123</Text>
        </View>
        
        <View style={styles.demoAccount}>
          <Text style={styles.demoRole}>👨‍🏫 Enseignant</Text>
          <Text style={styles.demoCredentials}>prof.math@centre.ma</Text>
          <Text style={styles.demoPassword}>Mot de passe: prof123</Text>
        </View>
        
        <View style={styles.demoAccount}>
          <Text style={styles.demoRole}>👨‍🎓 Élève</Text>
          <Text style={styles.demoCredentials}>eleve1@gmail.com</Text>
          <Text style={styles.demoPassword}>Mot de passe: eleve123</Text>
        </View>
      </Card>

      {/* GESTION DES PRÉSENCES */}
      <Card title="Gestion des présences" style={styles.section}>
        <SessionPicker
          placeholder="10/01/2026 - 10:00 - Français IBAC"
          sessions={[
            '10/01/2026 - 10:00 - Français IBAC',
            '11/01/2026 - 14:00 - Mathématiques 2BAC',
            '12/01/2026 - 09:00 - Physique 1BAC',
          ]}
          style={styles.inputSpacing}
        />
        
        <View style={styles.presenceStats}>
          <StatCard
            title="Présents"
            value="0"
            color={theme.colors.statPresent}
            compact
            style={styles.presenceStat}
          />
          
          <StatCard
            title="Absents"
            value="0"
            color={theme.colors.statAbsent}
            compact
            style={styles.presenceStat}
          />
          
          <StatCard
            title="Non marqués"
            value="1"
            color={theme.colors.statPending}
            compact
            style={styles.presenceStat}
          />
          
          <StatCard
            title="Total élèves"
            value="1"
            color={theme.colors.statTotal}
            compact
            style={styles.presenceStat}
          />
        </View>
        
        <Text style={styles.listTitle}>Liste de présences - Français IBAC</Text>
        
        <View style={styles.presenceTable}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCell}>Élève</Text>
            <Text style={styles.tableHeaderCell}>Niveau</Text>
            <Text style={styles.tableHeaderCell}>Statut</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Mohammed Chraibi</Text>
            <Text style={styles.tableCell}>IBAC Sciences</Text>
            <Badge text="Non marqué" type="warning" />
          </View>
          
          <View style={styles.actionsRow}>
            <Text style={styles.dateText}>10 janvier 2026</Text>
            <View style={styles.statusActions}>
              <Button
                title="Présent"
                size="small"
                variant="success"
                style={styles.statusButton}
              />
              <Button
                title="Absent"
                size="small"
                variant="danger"
                style={styles.statusButton}
              />
            </View>
          </View>
        </View>
        
        
      </Card>

      {/* COMPOSANTS BOUTONS */}
      <Card title="Bibliothèque de boutons" style={styles.section}>
        <View style={styles.buttonGroup}>
          <Button 
            title="Primaire" 
            onPress={() => handlePress("Primaire")}
            style={styles.buttonSpacing}
          />
          
          <Button 
            title="Secondaire" 
            variant="secondary"
            onPress={() => handlePress("Secondaire")}
            style={styles.buttonSpacing}
          />
          
          <Button 
            title="Outline" 
            variant="outline"
            onPress={() => handlePress("Outline")}
            style={styles.buttonSpacing}
          />
          
          <Button 
            title="Danger" 
            variant="danger"
            onPress={() => handlePress("Danger")}
            style={styles.buttonSpacing}
          />
          
          <Button 
            title="Success" 
            variant="success"
            onPress={() => handlePress("Success")}
            style={styles.buttonSpacing}
          />
          
          <Button 
            title="Désactivé" 
            disabled
            onPress={() => handlePress("Désactivé")}
            style={styles.buttonSpacing}
          />
          
          <Button 
            title="Chargement" 
            loading
            onPress={() => handlePress("Chargement")}
            style={styles.buttonSpacing}
          />
        </View>
        
        <Text style={styles.subsectionTitle}>Tailles :</Text>
        <View style={styles.buttonRow}>
          <Button 
            title="Petit" 
            size="small"
            onPress={() => handlePress("Petit")}
            style={styles.buttonRowItem}
          />
          
          <Button 
            title="Moyen" 
            size="medium"
            onPress={() => handlePress("Moyen")}
            style={styles.buttonRowItem}
          />
          
          <Button 
            title="Grand" 
            size="large"
            onPress={() => handlePress("Grand")}
            style={styles.buttonRowItem}
          />
        </View>
      </Card>

      {/* COMPOSANTS STATCARD */}
      <Card title="Composants StatCard" style={styles.section}>
        <View style={styles.statCardRow}>
          <StatCard
            title="Présents"
            value="12"
            subtitle="Élèves présents"
            color={theme.colors.statPresent}
            style={styles.statCardItem}
          />
          
          <StatCard
            title="Absents"
            value="2"
            subtitle="Élèves absents"
            color={theme.colors.statAbsent}
            style={styles.statCardItem}
          />
        </View>
        
        <View style={styles.statCardRow}>
          <StatCard
            title="Non marqués"
            value="3"
            subtitle="En attente"
            color={theme.colors.statPending}
            style={styles.statCardItem}
          />
          
          <StatCard
            title="Total"
            value="17"
            subtitle="Élèves total"
            color={theme.colors.statTotal}
            style={styles.statCardItem}
          />
        </View>
        
        <View style={styles.statCardRow}>
          <StatCard
            title="Compact"
            value="42"
            subtitle="Version compacte"
            color={theme.colors.info}
            compact
            style={styles.statCardItem}
          />
          
          <StatCard
            title="Cliquable"
            value="24"
            subtitle="Appuyez-moi"
            color="#8b5cf6"
            onPress={() => Alert.alert('StatCard', 'Vous avez cliqué sur la stat!')}
            style={styles.statCardItem}
          />
        </View>
      </Card>

      {/* COMPOSANTS BADGE */}
      <Card title="Composants Badge" style={styles.section}>
        <View style={styles.badgeContainer}>
          <Badge text="Défaut" style={styles.badgeItem} />
          <Badge text="Succès" type="success" style={styles.badgeItem} />
          <Badge text="Danger" type="danger" style={styles.badgeItem} />
          <Badge text="Avertissement" type="warning" style={styles.badgeItem} />
          <Badge text="Info" type="info" style={styles.badgeItem} />
        </View>
        
        <Text style={styles.subsectionTitle}>Tailles :</Text>
        <View style={styles.badgeContainer}>
          <Badge text="Petit" size="small" style={styles.badgeItem} />
          <Badge text="Moyen" size="medium" style={styles.badgeItem} />
          <Badge text="Grand" size="large" style={styles.badgeItem} />
        </View>
        
        <Text style={styles.subsectionTitle}>Exemple de tableau :</Text>
        <View style={styles.exampleTable}>
          <View style={styles.exampleRow}>
            <Text style={styles.exampleCell}>Sara Alami</Text>
            <Text style={styles.exampleCell}>2BAC Sciences</Text>
            <Badge text="Présent" type="success" />
          </View>
          
          <View style={styles.exampleRow}>
            <Text style={styles.exampleCell}>Mohammed Chraibi</Text>
            <Text style={styles.exampleCell}>1BAC Sciences</Text>
            <Badge text="Absent" type="danger" />
          </View>          
          <View style={styles.exampleRow}>
            <Text style={styles.exampleCell}>Amina Benjelloun</Text>
            <Text style={styles.exampleCell}>2BAC Sciences</Text>
            <Badge text="Non marqué" type="warning" />
          </View>
        </View>
      </Card>
      <StatusBar style="auto" />
      <View style={styles.footer}>
        <Text style={styles.footerText}>Design System v1.0 - Centre de Rattrapage</Text>
        <Text style={styles.footerSubtext}>6 composants réutilisables</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.headerBg,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes['3xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.textLight,
    opacity: 0.9,
  },
  section: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionDescription: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  inputSpacing: {
    marginBottom: theme.spacing.md,
  },
  buttonSpacing: {
    marginBottom: theme.spacing.md,
  },
  buttonGroup: {
    gap: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  buttonRowItem: {
    flex: 1,
  },
  subsectionTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  demoAccount: {
    backgroundColor: theme.colors.lightGray,
    padding: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  demoRole: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  demoCredentials: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.xs,
  },
  demoPassword: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  presenceStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  presenceStat: {
    flex: 1,
    minWidth: '22%',
  },
  listTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  presenceTable: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.colors.lightGray,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  tableCell: {
    flex: 1,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  dateText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  statusActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statusButton: {
    minWidth: 80,
  },
  windowsAlert: {
    backgroundColor: theme.colors.info + '10',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
    padding: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
    alignItems: 'center',
  },
  windowsText: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  statCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  statCardItem: {
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  badgeItem: {
    marginBottom: theme.spacing.xs,
  },
  exampleTable: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.md,
    overflow: 'hidden',
  },
  exampleRow: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  exampleCell: {
    flex: 1,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textPrimary,
  },
  footer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    marginTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  footerSubtext: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});