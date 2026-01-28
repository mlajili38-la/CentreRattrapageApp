// components/calendar/SessionCard.js
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../common/Card/Card';
import Badge from '../common/Badge/Badge';

const SessionCard = memo(({ session }) => {
  const formatTimeDisplay = (timeString) => {
    if (!timeString) return '--:--';
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      const [hours, minutes] = timeString.split(':').map(Number);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return timeString;
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.date);
    
    if (session.status === 'completed') return 'Terminée';
    if (session.status === 'cancelled') return 'Annulée';
    
    if (sessionDate < now) return 'Passée';
    if (sessionDate.toDateString() === now.toDateString()) return "Aujourd'hui";
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (sessionDate.toDateString() === tomorrow.toDateString()) return 'Demain';
    
    return 'Planifiée';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Terminée': return '#4CAF50';
      case "Aujourd'hui": return '#2196F3';
      case 'Demain': return '#FF9800';
      case 'Planifiée': return '#9C27B0';
      case 'Annulée': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const status = getSessionStatus(session);
  const statusColor = getStatusColor(status);
  
  return (
    <Card style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={[styles.sessionIcon, { backgroundColor: `${session.color || '#2196F3'}20` }]}>
          <Ionicons name="calendar-outline" size={20} color={session.color || '#2196F3'} />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionGroup} numberOfLines={1}>
            {session.groupName || 'Séance'}
          </Text>
          <View style={styles.sessionBadges}>
            <Badge 
              text={session.subject || 'Matière'}
              backgroundColor={`${session.color || '#2196F3'}15`}
              textColor={session.color || '#2196F3'}
              size="small"
            />
            <Badge 
              text={status}
              backgroundColor={`${statusColor}20`}
              textColor={statusColor}
              size="small"
            />
          </View>
        </View>
      </View>
      
      <View style={styles.sessionDetails}>
        <View style={styles.sessionDetailRow}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.sessionTime}>
            {formatTimeDisplay(session.startTime)} - {formatTimeDisplay(session.endTime)}
          </Text>
        </View>
        <View style={styles.sessionDetailRow}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.sessionDate}>
            {session.date.toLocaleDateString('fr-FR', { 
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </Text>
        </View>
        {session.teacherName && (
          <View style={styles.sessionDetailRow}>
            <Ionicons name="person-outline" size={14} color="#666" />
            <Text style={styles.sessionTeacher}>{session.teacherName}</Text>
          </View>
        )}
        {session.room && (
          <View style={styles.sessionDetailRow}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.sessionRoom}>{session.room}</Text>
          </View>
        )}
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  sessionCard: {
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionGroup: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  sessionBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  sessionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  sessionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTime: {
    fontSize: 13,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  sessionDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  sessionTeacher: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  sessionRoom: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
});

export default SessionCard;