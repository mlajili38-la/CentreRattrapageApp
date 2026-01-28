// config/performance.js
export const PerformanceConfig = {
  // Limites pour les requêtes
  limits: {
    dashboard: {
      stats: 100, // Limite de documents pour les stats
      activities: 5, // Nombre max d'activités à afficher
      alerts: 3 // Nombre max d'alertes
    },
    lists: {
      default: 20, // Limite par défaut pour les listes
      search: 50 // Limite pour les recherches
    }
  },
  
  // Cache configuration
  cache: {
    dashboardStats: 30000, // 30 secondes
    activities: 60000, // 1 minute
    alerts: 120000 // 2 minutes
  },
  
  // Optimisations Firestore
  firestore: {
    useIndexes: true, // Utiliser les index Firestore
    batchSize: 10, // Taille des batchs pour les écritures
    disableNetwork: false // Ne pas désactiver le réseau
  }
};

// Fonction pour mesurer les performances
export const measurePerformance = (name, startTime) => {
  const endTime = performance.now();
  console.log(`⏱️  ${name}: ${(endTime - startTime).toFixed(2)}ms`);
  
  // Alerte si trop lent
  if (endTime - startTime > 1000) {
    console.warn(`⚠️  ${name} est lent: ${(endTime - startTime).toFixed(2)}ms`);
  }
};

export default PerformanceConfig;