// services/studentService.js - VERSION COMPLÈTE ET CORRIGÉE
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  Timestamp,
  limit,
  orderBy
} from 'firebase/firestore';

export class StudentService {
  
  // ==================== FONCTIONS PRINCIPALES ====================
  
  // 1. Récupérer un étudiant par email
  static async getStudentByEmail(email) {
    try {
      console.log('🔍 Recherche étudiant par email:', email);
      
      const studentsQuery = query(
        collection(db, 'students'),
        where('email', '==', email)
      );
      
      const querySnapshot = await getDocs(studentsQuery);
      
      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        const studentData = studentDoc.data();
        
        console.log('✅ Étudiant trouvé:', studentData.name);
        return {
          id: studentDoc.id,
          ...studentData
        };
      }
      
      console.log('❌ Aucun étudiant trouvé pour email:', email);
      return null;
      
    } catch (error) {
      console.error('❌ Erreur getStudentByEmail:', error);
      return null;
    }
  }
  
  // 2. Récupérer les groupes d'un étudiant
  static async getStudentGroups(studentId) {
    try {
      console.log('👥 Recherche groupes pour étudiant:', studentId);
      
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      
      if (!studentDoc.exists()) {
        console.log('❌ Étudiant non trouvé:', studentId);
        return [];
      }
      
      const studentData = studentDoc.data();
      const groupIds = studentData.groupIds || [];
      
      console.log(`📊 ${groupIds.length} groupes trouvés pour l'étudiant`);
      
      const groups = await Promise.all(
        groupIds.map(async (groupId) => {
          try {
            const groupDoc = await getDoc(doc(db, 'groups', groupId));
            if (groupDoc.exists()) {
              const groupData = groupDoc.data();
              return {
                id: groupId,
                name: groupData.name || `Groupe ${groupId}`,
                subject: groupData.subject || 'Matière',
                subjectId: groupData.subjectId,
                teacherId: groupData.teacherId,
                ...groupData
              };
            }
            return null;
          } catch (error) {
            console.log(`⚠️ Erreur groupe ${groupId}:`, error.message);
            return null;
          }
        })
      );
      
      const validGroups = groups.filter(group => group !== null);
      console.log(`✅ ${validGroups.length} groupes chargés`);
      
      return validGroups;
      
    } catch (error) {
      console.error('❌ Erreur getStudentGroups:', error);
      return [];
    }
  }
  
  // 3. CALENDRIER - Version optimisée pour récupérer les sessions
  static async getStudentCalendar(studentId) {
    try {
      console.log('📅 CHARGEMENT CALENDRIER pour étudiant:', studentId);
      
      // 1. Récupérer l'étudiant
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      if (!studentDoc.exists()) {
        console.log('❌ Étudiant non trouvé');
        return [];
      }
      
      const studentData = studentDoc.data();
      const groupIds = studentData.groupIds || [];
      
      if (groupIds.length === 0) {
        console.log('⚠️ Étudiant sans groupes');
        return [];
      }
      
      console.log(`🔍 Recherche dans ${groupIds.length} groupes`);
      
      const allSessions = [];
      const now = new Date();
      console.log('⏰ Date actuelle:', now.toLocaleString());
      
      // 2. Pour chaque groupe, récupérer les sessions
      for (const groupId of groupIds) {
        try {
          console.log(`   🔎 Recherche sessions groupe ${groupId}...`);
          
          // IMPORTANT: Ne pas utiliser limit() si on veut toutes les sessions
          const sessionsQuery = query(
            collection(db, 'sessions'),
            where('groupId', '==', groupId)
            // Ne pas mettre de limit() pour avoir toutes les sessions
          );
          
          const sessionsSnapshot = await getDocs(sessionsQuery);
          console.log(`   📄 ${sessionsSnapshot.size} sessions trouvées`);
          
          sessionsSnapshot.forEach((sessionDoc) => {
            try {
              const sessionData = sessionDoc.data();
              
              // DEBUG: Afficher données brutes
              console.log(`   📝 Session ${sessionDoc.id}:`, {
                hasDate: !!sessionData.date,
                dateType: typeof sessionData.date,
                dateValue: sessionData.date,
                groupName: sessionData.groupName,
                subject: sessionData.subject
              });
              
              // Convertir la date
              let sessionDate;
              
              if (sessionData.date && sessionData.date.toDate) {
                sessionDate = sessionData.date.toDate();
              } else if (sessionData.date && sessionData.date.seconds) {
                sessionDate = new Date(sessionData.date.seconds * 1000);
              } else if (sessionData.date && typeof sessionData.date === 'string') {
                sessionDate = new Date(sessionData.date);
              } else if (sessionData.date instanceof Date) {
                sessionDate = sessionData.date;
              } else {
                console.log(`   ⚠️ Pas de date valide pour session ${sessionDoc.id}`);
                return; // Ignorer cette session
              }
              
              // Vérifier si la date est valide
              if (!sessionDate || isNaN(sessionDate.getTime())) {
                console.log(`   ⚠️ Date invalide pour session ${sessionDoc.id}`);
                return;
              }
              
              console.log(`   📅 Date convertie: ${sessionDate.toLocaleString()}`);
              
              // Filtrer seulement les sessions FUTURES (dans les 90 prochains jours)
              const ninetyDaysFromNow = new Date();
              ninetyDaysFromNow.setDate(now.getDate() + 90);
              
              const isFuture = sessionDate >= now;
              const isWithin90Days = sessionDate <= ninetyDaysFromNow;
              
              console.log(`   📊 Analyse: future=${isFuture}, within90Days=${isWithin90Days}`);
              
              if (isFuture && isWithin90Days) {
                // Obtenir le nom de matière
                let subjectName = this.getSubjectNameFromGroup(sessionData, groupId);
                
                // Obtenir le nom du groupe
                let groupName = sessionData.groupName;
                if (!groupName) {
                  // Si pas de nom dans la session, essayer de récupérer du groupe
                  groupName = `Groupe ${groupId}`;
                }
                
                const sessionObject = {
                  id: sessionDoc.id,
                  date: sessionDate,
                  groupName: groupName,
                  groupId: groupId,
                  subject: subjectName,
                  subjectId: sessionData.subjectId,
                  teacherName: sessionData.teacherName || 'Professeur',
                  startTime: sessionData.startTime || '09:00',
                  endTime: sessionData.endTime || '10:00',
                  room: sessionData.room || 'Salle non définie',
                  status: sessionData.status || 'scheduled',
                  color: this.getSubjectColor(subjectName)
                };
                
                console.log(`   ✅ AJOUTÉ: ${subjectName} - ${sessionDate.toLocaleDateString()} ${sessionObject.startTime}`);
                
                allSessions.push(sessionObject);
              } else {
                console.log(`   ⏭️ IGNORÉ: Date ${sessionDate.toLocaleDateString()} n'est pas future`);
              }
              
            } catch (sessionError) {
              console.log(`   ❌ Erreur session ${sessionDoc.id}:`, sessionError.message);
            }
          });
          
        } catch (groupError) {
          console.log(`❌ Erreur groupe ${groupId}:`, groupError.message);
        }
      }
      
      console.log(`🎯 TOTAL SESSIONS: ${allSessions.length}`);
      
      // Trier par date (plus proche en premier)
      const sortedSessions = allSessions.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Limiter à 50 sessions maximum
      const limitedSessions = sortedSessions.slice(0, 50);
      
      console.log(`📈 Après tri: ${limitedSessions.length} sessions`);
      
      return limitedSessions;
      
    } catch (error) {
      console.error('💥 ERREUR getStudentCalendar:', error);
      return [];
    }
  }
  
  // 4. Récupérer les sessions futures (version simplifiée)
  static async getUpcomingSessions(studentId, limit = 10) {
    try {
      const allSessions = await this.getStudentCalendar(studentId);
      const now = new Date();
      
      // Filtrer seulement les futures (au cas où)
      const futureSessions = allSessions.filter(session => {
        return session.date >= now;
      });
      
      // Limiter
      return futureSessions.slice(0, limit);
      
    } catch (error) {
      console.error('❌ Erreur getUpcomingSessions:', error);
      return [];
    }
  }
  
  // ==================== FONCTIONS DE PRÉSENCE ====================
  
  static async getStudentAttendance(studentId) {
    try {
      console.log('✅ Recherche présences pour étudiant:', studentId);
      
      const attendancesQuery = query(
        collection(db, 'attendances'),
        where('studentId', '==', studentId)
      );
      
      const attendancesSnapshot = await getDocs(attendancesQuery);
      const attendances = [];
      
      attendancesSnapshot.forEach((doc) => {
        const attendanceData = doc.data();
        
        const normalizedAttendance = {
          id: doc.id,
          ...attendanceData
        };
        
        // Gérer la date
        if (attendanceData.date) {
          try {
            if (attendanceData.date.toDate) {
              normalizedAttendance.date = attendanceData.date.toDate();
            } else if (attendanceData.date.seconds) {
              normalizedAttendance.date = new Date(attendanceData.date.seconds * 1000);
            } else if (typeof attendanceData.date === 'string') {
              normalizedAttendance.date = new Date(attendanceData.date);
            }
          } catch (dateError) {
            console.log('⚠️ Erreur parsing date présence:', dateError);
          }
        }
        
        attendances.push(normalizedAttendance);
      });
      
      console.log(`✅ ${attendances.length} présences chargées`);
      
      // Calculer les statistiques
      let stats = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        percentage: 0
      };
      
      if (attendances.length > 0) {
        const total = attendances.length;
        const present = attendances.filter(a => 
          a.status === 'present' || a.status === 'excused'
        ).length;
        const absent = attendances.filter(a => a.status === 'absent').length;
        const late = attendances.filter(a => a.status === 'late').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        
        stats = {
          total,
          present,
          absent,
          late,
          percentage
        };
      }
      
      return {
        attendances: attendances,
        stats: stats
      };
      
    } catch (error) {
      console.error('❌ Erreur getStudentAttendance:', error);
      return {
        attendances: [],
        stats: { total: 0, present: 0, absent: 0, late: 0, percentage: 0 }
      };
    }
  }
  
  // ==================== FONCTIONS DE PAIEMENT ====================
  
  static async getStudentPayments(studentId) {
    try {
      console.log('💰 Recherche paiements pour étudiant:', studentId);
      
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('studentId', '==', studentId)
      );
      
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const payments = [];
      
      paymentsSnapshot.forEach((doc) => {
        const paymentData = doc.data();
        
        const normalizedPayment = {
          id: doc.id,
          ...paymentData
        };
        
        // Gérer la date
        if (paymentData.date) {
          try {
            if (paymentData.date.toDate) {
              normalizedPayment.paymentDate = paymentData.date.toDate();
            } else if (paymentData.date.seconds) {
              normalizedPayment.paymentDate = new Date(paymentData.date.seconds * 1000);
            } else if (typeof paymentData.date === 'string') {
              normalizedPayment.paymentDate = new Date(paymentData.date);
            }
          } catch (dateError) {
            console.log('⚠️ Erreur parsing date paiement:', dateError);
          }
        }
        
        payments.push(normalizedPayment);
      });
      
      console.log(`✅ ${payments.length} paiements chargés`);
      
      return payments;
      
    } catch (error) {
      console.error('❌ Erreur getStudentPayments:', error);
      return [];
    }
  }
  
  // ==================== FONCTIONS UTILITAIRES ====================
  
  // Fonction pour obtenir le nom de matière
  static getSubjectName(subjectId) {
    const subjectMap = {
      // IDs standards
      'SUB1': 'Mathématiques',
      'SUB2': 'Physique',
      'SUB3': 'Chimie',
      'SUB4': 'Anglais',
      'SUB5': 'Informatique',
      'SUB6': 'SVT',
      'SUB7': 'Arabe',
      'SUB8': 'Français',
      
      // IDs alternatifs
      'math': 'Mathématiques',
      'mathematics': 'Mathématiques',
      'physics': 'Physique',
      'chemistry': 'Chimie',
      'english': 'Anglais',
      'french': 'Français',
      'arabic': 'Arabe',
      'computer': 'Informatique',
      'biology': 'Biologie',
      'svt': 'SVT',
      'history': 'Histoire',
      'geography': 'Géographie',
      'philosophy': 'Philosophie',
      'science': 'Sciences',
      'spanish': 'Espagnol',
      'german': 'Allemand',
      'italian': 'Italien'
    };
    
    if (!subjectId) return 'Matière';
    
    // Vérifier si c'est déjà un nom
    if (Object.values(subjectMap).includes(subjectId)) {
      return subjectId;
    }
    
    // Chercher par ID (insensible à la casse)
    const normalizedId = subjectId.toString().toLowerCase();
    for (const [key, value] of Object.entries(subjectMap)) {
      if (key.toLowerCase() === normalizedId) {
        return value;
      }
    }
    
    // Si non trouvé, retourner l'ID original
    return subjectId;
  }
  
  // Obtenir le nom de matière à partir des données du groupe
  static getSubjectNameFromGroup(sessionData, groupId) {
    // Priorité 1: Le sujet de la session
    if (sessionData.subject && sessionData.subject !== 'Matière') {
      return sessionData.subject;
    }
    
    // Priorité 2: L'ID de sujet de la session
    if (sessionData.subjectId) {
      const name = this.getSubjectName(sessionData.subjectId);
      if (name !== 'Matière') {
        return name;
      }
    }
    
    // Priorité 3: Le nom du groupe
    if (sessionData.groupName) {
      const groupLower = sessionData.groupName.toLowerCase();
      
      if (groupLower.includes('math') || groupLower.includes('maths')) return 'Mathématiques';
      if (groupLower.includes('physique')) return 'Physique';
      if (groupLower.includes('chimie')) return 'Chimie';
      if (groupLower.includes('anglais')) return 'Anglais';
      if (groupLower.includes('français') || groupLower.includes('francais')) return 'Français';
      if (groupLower.includes('arabe')) return 'Arabe';
      if (groupLower.includes('info') || groupLower.includes('informatique')) return 'Informatique';
      if (groupLower.includes('svt') || groupLower.includes('biologie')) return 'SVT';
      if (groupLower.includes('histoire')) return 'Histoire';
      if (groupLower.includes('geo') || groupLower.includes('géographie')) return 'Géographie';
      if (groupLower.includes('philo')) return 'Philosophie';
      if (groupLower.includes('science')) return 'Sciences';
      if (groupLower.includes('espagnol')) return 'Espagnol';
      if (groupLower.includes('allemand')) return 'Allemand';
      if (groupLower.includes('italien')) return 'Italien';
      
      return sessionData.groupName;
    }
    
    // Priorité 4: Par défaut
    return 'Matière';
  }
  
  // Fonction pour assigner des couleurs aux matières
  static getSubjectColor(subjectName) {
    const colorMap = {
      'Mathématiques': '#2196F3', // Bleu
      'Physique': '#FF5722', // Orange
      'Chimie': '#4CAF50', // Vert
      'Anglais': '#FF9800', // Orange clair
      'Informatique': '#9C27B0', // Violet
      'SVT': '#009688', // Turquoise
      'Arabe': '#795548', // Marron
      'Français': '#3F51B5', // Bleu indigo
      'Biologie': '#8BC34A', // Vert clair
      'Histoire': '#FFC107', // Jaune
      'Géographie': '#00BCD4', // Cyan
      'Philosophie': '#E91E63', // Rose
      'Sciences': '#673AB7', // Violet profond
      'Espagnol': '#FF4081', // Rose vif
      'Allemand': '#607D8B', // Gris bleu
      'Italien': '#FF5252', // Rouge
      'Matière': '#9E9E9E' // Gris
    };
    
    return colorMap[subjectName] || '#607D8B';
  }
  
  // ==================== FONCTIONS DE STATISTIQUES ====================
  
  static async getQuickStats(studentId) {
    try {
      console.log('📊 Chargement stats rapides pour étudiant:', studentId);
      
      const [attendanceData, upcomingSessions, payments] = await Promise.all([
        this.getStudentAttendance(studentId),
        this.getUpcomingSessions(studentId, 5),
        this.getStudentPayments(studentId)
      ]);
      
      return {
        attendanceCount: attendanceData.attendances.length,
        attendancePercentage: attendanceData.stats.percentage,
        upcomingCount: upcomingSessions.length,
        paymentCount: payments.length,
        totalPaid: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        nextSession: upcomingSessions.length > 0 ? upcomingSessions[0] : null
      };
      
    } catch (error) {
      console.error('❌ Erreur getQuickStats:', error);
      return {
        attendanceCount: 0,
        attendancePercentage: 0,
        upcomingCount: 0,
        paymentCount: 0,
        totalPaid: 0,
        nextSession: null
      };
    }
  }
  
  // ==================== FONCTIONS DE DÉBOGAGE ====================
  
  // Test complet de toutes les données
  static async debugStudentData(studentId) {
    try {
      console.log('🐛 DÉBOGAGE COMPLET données étudiant:', studentId);
      
      // 1. Récupérer l'étudiant
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      
      if (!studentDoc.exists()) {
        console.log('❌ ERREUR: Étudiant non trouvé dans Firestore');
        return { error: 'Étudiant non trouvé' };
      }
      
      const studentData = studentDoc.data();
      console.log('📋 INFOS ÉTUDIANT:');
      console.log('   ID:', studentDoc.id);
      console.log('   Nom:', studentData.name);
      console.log('   Email:', studentData.email);
      console.log('   Groupes:', studentData.groupIds || []);
      
      const groupIds = studentData.groupIds || [];
      
      // 2. Vérifier chaque groupe
      console.log('\n👥 VÉRIFICATION GROUPES:');
      const groupsInfo = [];
      
      for (const groupId of groupIds) {
        try {
          const groupDoc = await getDoc(doc(db, 'groups', groupId));
          
          if (groupDoc.exists()) {
            const groupData = groupDoc.data();
            groupsInfo.push({
              id: groupId,
              name: groupData.name || 'Sans nom',
              subject: groupData.subject || 'Non défini',
              subjectId: groupData.subjectId || 'Non défini'
            });
            
            console.log(`   ✅ Groupe ${groupId}:`);
            console.log(`      Nom: ${groupData.name || 'Sans nom'}`);
            console.log(`      Matière: ${groupData.subject || 'Non défini'}`);
            console.log(`      ID Matière: ${groupData.subjectId || 'Non défini'}`);
          } else {
            console.log(`   ❌ Groupe ${groupId}: NON TROUVÉ dans Firestore`);
          }
        } catch (groupError) {
          console.log(`   ⚠️ Groupe ${groupId}: ERREUR ${groupError.message}`);
        }
      }
      
      // 3. Vérifier les sessions pour chaque groupe
      console.log('\n📅 VÉRIFICATION SESSIONS:');
      const sessionsInfo = [];
      const now = new Date();
      
      for (const groupId of groupIds) {
        try {
          const sessionsQuery = query(
            collection(db, 'sessions'),
            where('groupId', '==', groupId)
          );
          
          const sessionsSnapshot = await getDocs(sessionsQuery);
          console.log(`   🔍 Groupe ${groupId}: ${sessionsSnapshot.size} sessions`);
          
          sessionsSnapshot.forEach((sessionDoc, index) => {
            const sessionData = sessionDoc.data();
            
            // Convertir la date
            let sessionDate = null;
            if (sessionData.date?.toDate) {
              sessionDate = sessionData.date.toDate();
            } else if (sessionData.date?.seconds) {
              sessionDate = new Date(sessionData.date.seconds * 1000);
            }
            
            const isFuture = sessionDate && sessionDate >= now;
            
            sessionsInfo.push({
              id: sessionDoc.id,
              groupId: groupId,
              date: sessionDate,
              isFuture: isFuture,
              subject: sessionData.subject || 'Non défini',
              groupName: sessionData.groupName || 'Sans nom',
              rawDate: sessionData.date
            });
            
            if (index < 3) { // Afficher seulement les 3 premières pour ne pas spammer
              console.log(`      Session ${sessionDoc.id}:`);
              console.log(`         Date: ${sessionDate ? sessionDate.toLocaleString() : 'NULL'}`);
              console.log(`         Futur: ${isFuture ? 'OUI' : 'NON'}`);
              console.log(`         Matière: ${sessionData.subject || 'Non défini'}`);
              console.log(`         Groupe: ${sessionData.groupName || 'Sans nom'}`);
            }
          });
          
        } catch (sessionError) {
          console.log(`   ❌ Sessions groupe ${groupId}: ERREUR ${sessionError.message}`);
        }
      }
      
      // 4. Statistiques
      console.log('\n📈 STATISTIQUES:');
      console.log(`   Groupes trouvés: ${groupsInfo.length}`);
      console.log(`   Sessions totales: ${sessionsInfo.length}`);
      
      const futureSessions = sessionsInfo.filter(s => s.isFuture);
      console.log(`   Sessions futures: ${futureSessions.length}`);
      
      if (futureSessions.length > 0) {
        console.log('   Prochaines sessions futures:');
        futureSessions.slice(0, 5).forEach((session, index) => {
          console.log(`     ${index + 1}. ${session.subject} - ${session.date.toLocaleDateString()} (${session.groupName})`);
        });
      }
      
      // 5. Retourner les résultats pour affichage
      return {
        student: {
          id: studentDoc.id,
          name: studentData.name,
          email: studentData.email,
          groupIds: groupIds
        },
        groups: groupsInfo,
        sessions: {
          total: sessionsInfo.length,
          future: futureSessions.length,
          list: futureSessions.slice(0, 10)
        },
        debug: {
          now: now.toISOString(),
          timestamp: Date.now()
        }
      };
      
    } catch (error) {
      console.error('💥 ERREUR debugStudentData:', error);
      return { error: error.message };
    }
  }
  
  // Test de connexion Firestore
  static async testFirestoreConnection() {
    try {
      console.log('🔗 TEST CONNEXION FIRESTORE...');
      
      // Test 1: Collection étudiants
      const studentsRef = collection(db, 'students');
      const studentsSnapshot = await getDocs(studentsRef);
      console.log(`✅ Étudiants: ${studentsSnapshot.size} documents`);
      
      // Test 2: Collection groupes
      const groupsRef = collection(db, 'groups');
      const groupsSnapshot = await getDocs(groupsRef);
      console.log(`✅ Groupes: ${groupsSnapshot.size} documents`);
      
      // Test 3: Collection sessions
      const sessionsRef = collection(db, 'sessions');
      const sessionsSnapshot = await getDocs(sessionsRef);
      console.log(`✅ Sessions: ${sessionsSnapshot.size} documents`);
      
      // Afficher quelques sessions pour debug
      console.log('📄 EXEMPLE DE SESSIONS:');
      let count = 0;
      sessionsSnapshot.forEach((doc) => {
        if (count < 5) {
          const data = doc.data();
          console.log(`   ${doc.id}:`);
          console.log(`      Groupe: ${data.groupId || 'N/A'}`);
          console.log(`      Date: ${data.date ? (data.date.toDate ? data.date.toDate().toISOString() : data.date) : 'N/A'}`);
          console.log(`      Matière: ${data.subject || 'N/A'}`);
          count++;
        }
      });
      
      return {
        success: true,
        counts: {
          students: studentsSnapshot.size,
          groups: groupsSnapshot.size,
          sessions: sessionsSnapshot.size
        }
      };
      
    } catch (error) {
      console.error('❌ TEST FIRESTORE ÉCHOUÉ:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Créer des données de test (uniquement pour le développement)
  static async createTestSessions(studentId) {
    console.log('🧪 CRÉATION DE SESSIONS DE TEST...');
    
    // Cette fonction ne fait que log pour l'instant
    // En production, elle pourrait créer des sessions de test
    
    console.log('⚠️ Fonction de création de test désactivée en mode production');
    console.log('💡 Pour tester, ajoutez manuellement des sessions dans Firebase Console:');
    console.log('   1. Allez dans la collection "sessions"');
    console.log('   2. Cliquez sur "Ajouter un document"');
    console.log('   3. Ajoutez ces champs:');
    console.log('      - groupId: ID d\'un groupe de l\'étudiant');
    console.log('      - date: Timestamp (choisissez une date future)');
    console.log('      - subject: "Mathématiques"');
    console.log('      - groupName: "Groupe de Maths"');
    console.log('      - startTime: "14:00"');
    console.log('      - endTime: "15:30"');
    
    return { message: 'Voir les instructions dans les logs' };
  }
}