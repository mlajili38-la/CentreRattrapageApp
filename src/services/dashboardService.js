// services/dashboardService.js
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const getDashboardStats = async () => {
  try {
    // Récupérer toutes les collections
    const [
      teachersSnapshot,
      studentsSnapshot,
      groupsSnapshot,
      sessionsSnapshot,
      roomsSnapshot,
      attendancesSnapshot,
      paymentsSnapshot,
      subjectsSnapshot
    ] = await Promise.all([
      getDocs(collection(db, 'teachers')),
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'groups')),
      getDocs(collection(db, 'sessions')),
      getDocs(collection(db, 'rooms')),
      getDocs(collection(db, 'attendances')),
      getDocs(collection(db, 'payments')),
      getDocs(collection(db, 'subjects'))
    ]);

    // Convertir les données
    const teachers = teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const groups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculer les statistiques
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Sessions ce mois-ci
    const thisMonthSessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startOfMonth;
    });

    // Paiements ce mois-ci
    const thisMonthPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= startOfMonth && payment.status === 'completed';
    });

    // Total des paiements du mois
    const monthlyRevenue = thisMonthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Salaires des enseignants (exemple)
    const teacherPayments = [
      { teacher: 'Ahmed Bennani', amount: 4500 },
      { teacher: 'Fatima Zahra El Idrissi', amount: 3200 },
      { teacher: 'Youssef Tazi', amount: 2880 },
      { teacher: 'Nadia Amrani', amount: 1800 },
      { teacher: 'Karim Belhaj', amount: 2240 },
    ];

    const totalSalaries = teacherPayments.reduce((sum, tp) => sum + tp.amount, 0);
    const netProfit = monthlyRevenue - totalSalaries;

    // Groupes par niveau
    const groupsByLevel = {};
    groups.forEach(group => {
      const level = group.level || 'Non spécifié';
      groupsByLevel[level] = (groupsByLevel[level] || 0) + 1;
    });

    // Élèves par niveau
    const studentsByLevel = {};
    students.forEach(student => {
      const level = student.level || 'Non spécifié';
      studentsByLevel[level] = (studentsByLevel[level] || 0) + 1;
    });

    return {
      basicStats: {
        teachers: teachers.length,
        students: students.length,
        groups: groups.length,
        sessions: thisMonthSessions.length,
        rooms: roomsSnapshot.size,
        attendances: attendancesSnapshot.size,
        payments: thisMonthPayments.length,
        subjects: subjectsSnapshot.size,
      },
      financialStats: {
        monthlyRevenue,
        totalSalaries,
        netProfit,
        outstandingPayments: 3, // Exemple: paiements en retard
      },
      distribution: {
        groupsByLevel,
        studentsByLevel,
      },
      recentActivities: [
        {
          id: 1,
          type: 'new_student',
          title: 'Nouvelle inscription',
          description: 'Yassin El Fassi',
          time: 'Il y a 2 heures',
          color: '#22c55e'
        },
        {
          id: 2,
          type: 'payment',
          title: 'Paiement reçu',
          description: 'Mohammed Chraibi - 1200 DH',
          time: 'Il y a 3 heures',
          color: '#22c55e'
        },
        {
          id: 3,
          type: 'session_cancelled',
          title: 'Séance annulée',
          description: 'Maths 2BAC - Groupe A',
          time: 'Il y a 5 heures',
          color: '#f97316'
        },
        {
          id: 4,
          type: 'new_teacher',
          title: 'Nouvel enseignant',
          description: 'Nadia Amrani (SVT)',
          time: 'Hier',
          color: '#3b82f6'
        }
      ],
      alerts: [
        {
          id: 1,
          type: 'warning',
          title: '3 paiements en retard ce mois',
          description: 'Sara Alami, Omar Kettani, Yassin El Fassi',
          color: '#92400e',
          bgColor: '#fef3c7'
        },
        {
          id: 2,
          type: 'info',
          title: `${thisMonthSessions.length} séances nécessitent un marquage de présences`,
          description: 'À faire cette semaine',
          color: '#1e40af',
          bgColor: '#eff6ff'
        },
        {
          id: 3,
          type: 'maintenance',
          title: '2 salles en maintenance cette semaine',
          description: 'Salle B et Salle D',
          color: '#475569',
          bgColor: '#f1f5f9'
        }
      ]
    };
    
  } catch (error) {
    console.error('Erreur dans getDashboardStats:', error);
    
    // Retourner des données de démonstration en cas d'erreur
    return {
      basicStats: {
        teachers: 4,
        students: 7,
        groups: 6,
        sessions: 8,
        rooms: 5,
        attendances: 7,
        payments: 8,
        subjects: 8,
      },
      financialStats: {
        monthlyRevenue: 9400,
        totalSalaries: 14820,
        netProfit: -5420,
        outstandingPayments: 3,
      },
      distribution: {
        groupsByLevel: {
          '2BAC Sciences Mathématiques': 3,
          '1BAC Sciences Mathématiques': 1,
          '1BAC Sciences Expérimentales': 1,
          'Tronc Commun Sciences': 1,
        },
        studentsByLevel: {
          '2BAC Sciences Mathématiques': 3,
          '1BAC Sciences Mathématiques': 2,
          '1BAC Sciences Expérimentales': 1,
          'Tronc Commun Sciences': 1,
        }
      },
      recentActivities: [],
      alerts: []
    };
  }
};