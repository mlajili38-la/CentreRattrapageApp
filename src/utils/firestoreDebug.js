// utils/firestoreDebug.js
import { db } from '../services/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export const debugFirestore = async () => {
  console.log('🔍 DÉBOGAGE FIRESTORE');
  
  try {
    // 1. Vérifier les étudiants
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    console.log(`👥 Étudiants totaux: ${studentsSnapshot.size}`);
    
    studentsSnapshot.forEach(studentDoc => {
      console.log(`  - ${studentDoc.id}:`, studentDoc.data());
    });
    
    // 2. Vérifier les groupes
    const groupsSnapshot = await getDocs(collection(db, 'groups'));
    console.log(`📚 Groupes totaux: ${groupsSnapshot.size}`);
    
    groupsSnapshot.forEach(groupDoc => {
      console.log(`  - ${groupDoc.id}:`, groupDoc.data());
    });
    
    // 3. Vérifier les sessions
    const sessionsSnapshot = await getDocs(collection(db, 'sessions'));
    console.log(`📅 Sessions totales: ${sessionsSnapshot.size}`);
    
    sessionsSnapshot.forEach(sessionDoc => {
      const data = sessionDoc.data();
      console.log(`  - ${sessionDoc.id}:`, {
        groupId: data.groupId,
        date: data.date,
        subject: data.subject,
        startTime: data.startTime
      });
    });
    
    // 4. Vérifier les présences
    const attendancesSnapshot = await getDocs(collection(db, 'attendances'));
    console.log(`✅ Présences totales: ${attendancesSnapshot.size}`);
    
    // 5. Vérifier un étudiant spécifique (ex: S5)
    console.log('\n🔍 Vérification étudiant S5:');
    const studentS5 = await getDoc(doc(db, 'students', 'S5'));
    if (studentS5.exists()) {
      console.log('✅ Étudiant S5 trouvé:', studentS5.data());
    } else {
      console.log('❌ Étudiant S5 non trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur débogage:', error);
  }
};