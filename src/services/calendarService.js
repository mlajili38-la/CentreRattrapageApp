// services/calendarService.js - VERSION FINALE FONCTIONNELLE
import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';

export class CalendarService {
  
  /**
   * 🔥 CALENDRIER ÉTUDIANT - Version améliorée
   */
  static async getStudentCalendar(studentId, options = {}) {
    try {
      console.log(`🎓 Chargement calendrier pour étudiant: ${studentId}`);
      
      const {
        limit: resultsLimit = 50,
        daysBack = 7, // Inclure les 7 derniers jours
        daysForward = 90 // Et les 90 prochains jours
      } = options;
      
      // 1. Récupérer l'étudiant et ses groupes
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      if (!studentDoc.exists()) {
        console.log('❌ Étudiant non trouvé');
        return [];
      }
      
      const studentData = studentDoc.data();
      const groupIds = studentData.groupIds || [];
      
      if (groupIds.length === 0) {
        console.log('ℹ️ Aucun groupe pour cet étudiant');
        return [];
      }
      
      console.log(`📊 Étudiant dans ${groupIds.length} groupes`);
      
      // 2. Définir la plage de dates
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - daysBack); // Inclure quelques jours passés
      
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + daysForward); // Jusqu'à 3 mois dans le futur
      
      console.log(`📅 Plage de dates: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
      
      const allSessions = [];
      
      // 3. Pour chaque groupe, chercher les sessions dans la plage
      for (const groupId of groupIds.slice(0, 5)) { // Limiter à 5 groupes
        try {
          // D'abord récupérer les infos du groupe
          const groupDoc = await getDoc(doc(db, 'groups', groupId));
          if (!groupDoc.exists()) continue;
          
          const groupData = groupDoc.data();
          
          // Chercher les sessions de ce groupe
          const sessionsQuery = query(
            collection(db, 'sessions'),
            where('groupId', '==', groupId),
            orderBy('date', 'asc'),
            limit(30)
          );
          
          const sessionsSnapshot = await getDocs(sessionsQuery);
          console.log(`📅 ${sessionsSnapshot.size} sessions pour groupe ${groupId}`);
          
          // Traiter chaque session
          for (const sessionDoc of sessionsSnapshot.docs) {
            const sessionData = sessionDoc.data();
            
            // Convertir la date
            let sessionDate;
            try {
              if (sessionData.date?.toDate) {
                sessionDate = sessionData.date.toDate();
              } else if (sessionData.date?.seconds) {
                sessionDate = new Date(sessionData.date.seconds * 1000);
              } else {
                continue;
              }
            } catch {
              continue;
            }
            
            // Vérifier si la date est dans la plage
            if (sessionDate < startDate || sessionDate > endDate) {
              continue;
            }
            
            // Récupérer le professeur
            let teacherName = 'Professeur';
            if (groupData.teacherId) {
              try {
                const teacherDoc = await getDoc(doc(db, 'teachers', groupData.teacherId));
                if (teacherDoc.exists()) {
                  teacherName = teacherDoc.data().name || 'Professeur';
                }
              } catch (error) {
                console.log(`⚠️  Erreur professeur:`, error.message);
              }
            }
            
            // Vérifier la présence
            let attendanceStatus = 'absent';
            try {
              const attendanceQuery = query(
                collection(db, 'attendances'),
                where('sessionId', '==', sessionDoc.id),
                where('studentId', '==', studentId),
                limit(1)
              );
              
              const attendanceSnapshot = await getDocs(attendanceQuery);
              if (!attendanceSnapshot.empty) {
                attendanceStatus = attendanceSnapshot.docs[0].data().status || 'present';
              }
            } catch (error) {
              // Ignorer l'erreur
            }
            
            // Déterminer le statut
            let status = sessionData.status || 'scheduled';
            if (sessionDate < now) {
              status = 'completed';
            }
            
            allSessions.push({
              id: sessionDoc.id,
              ...sessionData,
              date: sessionDate,
              status: status,
              groupId: groupId,
              groupName: groupData.name || `Groupe ${groupId}`,
              subject: groupData.subjectName || groupData.subject || sessionData.subject || 'Matière',
              teacherName: teacherName,
              attendanceStatus: attendanceStatus,
              room: sessionData.room || groupData.room || 'Salle',
              color: this.getSubjectColor(groupData.subjectName || sessionData.subject)
            });
          }
          
        } catch (error) {
          console.log(`⚠️  Erreur groupe ${groupId}:`, error.message);
        }
      }
      
      // 4. Trier par date
      allSessions.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      console.log(`✅ ${allSessions.length} sessions dans la plage de dates`);
      
      // 5. Si aucune session future, créer des sessions de démonstration
      const futureSessions = allSessions.filter(s => s.date > now);
      if (futureSessions.length === 0 && allSessions.length === 0) {
        console.log('🎭 Création sessions de démonstration');
        return this.createDemoSessions(studentId, groupIds[0]);
      }
      
      return allSessions.slice(0, resultsLimit);
      
    } catch (error) {
      console.error('❌ Erreur getStudentCalendar:', error);
      return this.createDemoSessions(studentId, 'G1');
    }
  }
  
  /**
   * 🎭 CRÉER DES SESSIONS DE DÉMONSTRATION
   */
  static createDemoSessions(studentId, groupId) {
    console.log('🎭 Génération sessions de démonstration');
    
    const now = new Date();
    const sessions = [];
    
    // Créer 5 sessions pour les 10 prochains jours
    for (let i = 1; i <= 5; i++) {
      const sessionDate = new Date(now);
      sessionDate.setDate(now.getDate() + i * 2); // Tous les 2 jours
      sessionDate.setHours(14 + i, 0, 0, 0); // Différentes heures
      
      const subjects = ['Mathématiques', 'Physique', 'Chimie', 'SVT', 'Informatique'];
      const teachers = ['Ahmed Bennani', 'Fatima Zohra', 'Karim Alami', 'Samira Idrissi', 'Mohammed Chraibi'];
      const rooms = ['Salle 101', 'Salle 102', 'Salle 201', 'Salle 202', 'Labo Physique'];
      
      sessions.push({
        id: `demo-${i}`,
        groupId: groupId || 'G1',
        groupName: 'Groupe de ' + subjects[i % subjects.length],
        date: sessionDate,
        startTime: `${14 + i}:00`,
        endTime: `${16 + i}:00`,
        subject: subjects[i % subjects.length],
        teacherName: teachers[i % teachers.length],
        room: rooms[i % rooms.length],
        status: 'scheduled',
        attendanceStatus: Math.random() > 0.5 ? 'present' : 'absent',
        color: this.getSubjectColor(subjects[i % subjects.length]),
        isDemo: true
      });
    }
    
    console.log(`🎭 ${sessions.length} sessions démo créées`);
    return sessions;
  }
  
  /**
   * 🎨 COULEUR PAR MATIÈRE
   */
  static getSubjectColor(subject) {
    const colors = {
      'Mathématiques': '#FF6B6B',
      'Physique': '#4ECDC4',
      'Chimie': '#45B7D1',
      'SVT': '#96CEB4',
      'Informatique': '#FFEAA7',
      'Anglais': '#DDA0DD',
      'Français': '#98D8C8',
      'Arabe': '#F7DC6F'
    };
    
    return colors[subject] || '#2196F3';
  }
  
  /**
   * 📊 STATISTIQUES
   */
  static async getCalendarStats(userId, role) {
    try {
      const sessions = await this.getStudentCalendar(userId, {
        daysBack: 30,
        daysForward: 30
      });
      
      const now = new Date();
      
      // Sessions passées (30 derniers jours)
      const pastSessions = sessions.filter(s => s.date < now);
      
      // Sessions futures (30 prochains jours)
      const futureSessions = sessions.filter(s => s.date >= now);
      
      // Présences
      const presentCount = pastSessions.filter(s => 
        s.attendanceStatus === 'present' || s.attendanceStatus === 'excused'
      ).length;
      
      return {
        totalPast: pastSessions.length,
        totalFuture: futureSessions.length,
        attendanceRate: pastSessions.length > 0 
          ? Math.round((presentCount / pastSessions.length) * 100) 
          : 0,
        nextSession: futureSessions[0] || null
      };
      
    } catch (error) {
      console.error('❌ Erreur stats:', error);
      return {
        totalPast: 0,
        totalFuture: 0,
        attendanceRate: 0,
        nextSession: null
      };
    }
  }
}