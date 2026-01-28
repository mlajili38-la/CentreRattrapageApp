// src/components/calendar/CalendarGrid.js - VERSION SIMPLIFIÉE
import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Supprimer Dimensions et utiliser un calcul simple
const daySize = 40; // Taille fixe pour simplifier

const CalendarGrid = memo(({ 
  year, 
  month, 
  sessions = [], 
  selectedDate, 
  onDateSelect,
  onMonthChange 
}) => {
  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const dayNames = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
  
  // Générer les jours du calendrier
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateKey = new Date(selectedDate).setHours(0, 0, 0, 0);
    
    // Créer un Set des dates avec sessions
    const sessionDates = new Map();
    sessions.forEach(session => {
      try {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        const timestamp = sessionDate.getTime();
        
        if (sessionDate.getMonth() === month && sessionDate.getFullYear() === year) {
          sessionDates.set(timestamp, (sessionDates.get(timestamp) || 0) + 1);
        }
      } catch (e) {
        // Ignorer les erreurs
      }
    });

    // Jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        hasSession: false
      });
    }
    
    // Jours du mois courant
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      currentDate.setHours(0, 0, 0, 0);
      
      const isFutureOrToday = currentDate >= today;
      const dateKey = currentDate.getTime();
      
      const sessionCount = sessionDates.get(dateKey) || 0;
      const hasSession = isFutureOrToday && sessionCount > 0;
      
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        hasSession,
        sessionCount,
        isToday: currentDate.getTime() === today.getTime(),
        isSelected: currentDate.getTime() === selectedDateKey,
        isPast: currentDate < today
      });
    }
    
    // Jours du mois suivant
    const totalCells = 42;
    const nextMonthDays = totalCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        hasSession: false
      });
    }
    
    return days;
  }, [year, month, sessions, selectedDate]);

  const renderDay = (day, index) => {
    const isSelectable = day.isCurrentMonth && !day.isPast;
    
    return (
      <TouchableOpacity
        key={`day-${index}-${day.date.getTime()}`}
        style={[
          styles.dayCell,
          !day.isCurrentMonth && styles.otherMonthDay,
          day.isToday && styles.todayDay,
          day.isSelected && styles.selectedDay,
          day.isPast && styles.pastDay,
          !isSelectable && styles.unselectableDay
        ]}
        onPress={() => {
          if (isSelectable) {
            onDateSelect(day.date);
          }
        }}
        disabled={!isSelectable}
      >
        <Text style={[
          styles.dayNumber,
          !day.isCurrentMonth && styles.otherMonthText,
          day.isToday && styles.todayText,
          day.isSelected && styles.selectedText,
          day.isPast && styles.pastText
        ]}>
          {day.date.getDate()}
        </Text>
        
        {day.hasSession && (
          <View style={styles.sessionIndicator}>
            {day.sessionCount > 1 && (
              <Text style={styles.sessionCount}>{day.sessionCount}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <View style={styles.calendarHeader}>
        <View style={styles.monthNav}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => onMonthChange('prev')}
          >
            <Ionicons name="chevron-back" size={20} color="#2196F3" />
          </TouchableOpacity>
          
          <Text style={styles.monthYear}>
            {monthNames[month]} {year}
          </Text>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => onMonthChange('next')}
          >
            <Ionicons name="chevron-forward" size={20} color="#2196F3" />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysRow}>
          {dayNames.map((day, index) => (
            <Text key={`weekday-${index}`} style={styles.weekDay}>
              {day}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.daysGrid}>
        {calendarDays.map(renderDay)}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  calendarHeader: {
    marginBottom: 12,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  weekDay: {
    width: daySize,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dayCell: {
    width: daySize,
    height: daySize,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    margin: 1,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  todayDay: {
    backgroundColor: '#e3f2fd',
    borderRadius: daySize / 2,
  },
  selectedDay: {
    backgroundColor: '#2196F3',
    borderRadius: daySize / 2,
  },
  pastDay: {
    opacity: 0.5,
  },
  unselectableDay: {
    // Style pour les jours non sélectionnables
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  otherMonthText: {
    color: '#bdbdbd',
  },
  todayText: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pastText: {
    color: '#999',
  },
  sessionIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  sessionCount: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: '#2196F3',
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    minWidth: 12,
    height: 12,
    borderRadius: 6,
    textAlign: 'center',
    lineHeight: 12,
  },
});

export default CalendarGrid;