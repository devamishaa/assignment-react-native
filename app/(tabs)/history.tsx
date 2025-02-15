import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

type HistoryEntry = {
  timerId: string;
  name: string;
  category: string;
  completedAt: string;
};

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem('timerHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {history.length === 0 ? (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No completed timers yet</Text>
            <Text style={styles.emptySubtext}>
              Complete some timers to see them here
            </Text>
          </MotiView>
        ) : (
          history
            .sort(
              (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
            )
            .map((entry, index) => (
              <MotiView
                key={`${entry.timerId}-${index}`}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'timing',
                  duration: 500,
                  delay: index * 100,
                }}
                style={styles.historyItem}>
                <LinearGradient
                  colors={['#F9FAFB', '#F3F4F6']}
                  style={styles.historyItemGradient}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.timerName}>{entry.name}</Text>
                    <Text style={styles.category}>{entry.category}</Text>
                  </View>
                  <Text style={styles.completedAt}>
                    Completed: {formatDate(entry.completedAt)}
                  </Text>
                </LinearGradient>
              </MotiView>
            ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyItem: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyItemGradient: {
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  category: {
    fontSize: 14,
    color: '#007AFF',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  completedAt: {
    fontSize: 14,
    color: '#6B7280',
  },
});