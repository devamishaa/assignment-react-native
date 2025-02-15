import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

type Timer = {
  id: string;
  name: string;
  duration: number;
  remainingTime: number;
  category: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  halfwayAlert: boolean;
  halfwayAlertTriggered?: boolean;
};

type GroupedTimers = {
  [key: string]: Timer[];
};

export default function TimersScreen() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTimer, setNewTimer] = useState({
    name: '',
    duration: '',
    category: '',
    halfwayAlert: false,
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadTimers();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((currentTimers) =>
        currentTimers.map((timer) => {
          if (timer.status !== 'running') return timer;

          const newRemainingTime = timer.remainingTime - 1;
          if (newRemainingTime <= 0) {
            handleTimerComplete(timer);
            return { ...timer, remainingTime: 0, status: 'completed' };
          }

          if (
            timer.halfwayAlert &&
            !timer.halfwayAlertTriggered &&
            newRemainingTime <= timer.duration / 2
          ) {
            Alert.alert('Halfway Point!', `${timer.name} is halfway complete!`);
            return {
              ...timer,
              remainingTime: newRemainingTime,
              halfwayAlertTriggered: true,
            };
          }

          return { ...timer, remainingTime: newRemainingTime };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadTimers = async () => {
    try {
      const storedTimers = await AsyncStorage.getItem('timers');
      if (storedTimers) {
        setTimers(JSON.parse(storedTimers));
      }
    } catch (error) {
      console.error('Error loading timers:', error);
    }
  };

  const saveTimers = async (updatedTimers: Timer[]) => {
    try {
      await AsyncStorage.setItem('timers', JSON.stringify(updatedTimers));
    } catch (error) {
      console.error('Error saving timers:', error);
    }
  };

  const handleAddTimer = () => {
    if (!newTimer.name || !newTimer.duration || !newTimer.category) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const duration = parseInt(newTimer.duration, 10);
    const timer: Timer = {
      id: Date.now().toString(),
      name: newTimer.name,
      duration,
      remainingTime: duration,
      category: newTimer.category,
      status: 'idle',
      halfwayAlert: newTimer.halfwayAlert,
    };

    const updatedTimers = [...timers, timer];
    setTimers(updatedTimers);
    saveTimers(updatedTimers);
    setModalVisible(false);
    setNewTimer({ name: '', duration: '', category: '', halfwayAlert: false });
  };

  const handleTimerComplete = async (timer: Timer) => {
    const historyEntry = {
      timerId: timer.id,
      name: timer.name,
      category: timer.category,
      completedAt: new Date().toISOString(),
    };

    try {
      const history = await AsyncStorage.getItem('timerHistory');
      const parsedHistory = history ? JSON.parse(history) : [];
      await AsyncStorage.setItem(
        'timerHistory',
        JSON.stringify([...parsedHistory, historyEntry])
      );
    } catch (error) {
      console.error('Error saving to history:', error);
    }

    Alert.alert('Timer Complete! 🎉', `${timer.name} has finished!`);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const groupTimersByCategory = useCallback(() => {
    return timers.reduce((groups: GroupedTimers, timer) => {
      const category = timer.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(timer);
      return groups;
    }, {});
  }, [timers]);

  const handleTimerAction = (
    timerId: string,
    action: 'start' | 'pause' | 'reset'
  ) => {
    const updatedTimers = timers.map((timer) => {
      if (timer.id !== timerId) return timer;

      switch (action) {
        case 'start':
          return { ...timer, status: 'running' };
        case 'pause':
          return { ...timer, status: 'paused' };
        case 'reset':
          return {
            ...timer,
            remainingTime: timer.duration,
            status: 'idle',
            halfwayAlertTriggered: false,
          };
        default:
          return timer;
      }
    });

    setTimers(updatedTimers);
    saveTimers(updatedTimers);
  };

  const handleCategoryAction = (
    category: string,
    action: 'start' | 'pause' | 'reset'
  ) => {
    const updatedTimers = timers.map((timer) => {
      if (timer.category !== category) return timer;

      switch (action) {
        case 'start':
          return { ...timer, status: 'running' };
        case 'pause':
          return { ...timer, status: 'paused' };
        case 'reset':
          return {
            ...timer,
            remainingTime: timer.duration,
            status: 'idle',
            halfwayAlertTriggered: false,
          };
        default:
          return timer;
      }
    });

    setTimers(updatedTimers);
    saveTimers(updatedTimers);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderProgressBar = (timer: Timer) => {
    const progress = (timer.remainingTime / timer.duration) * 100;
    return (
      <View style={styles.progressBarContainer}>
        <MotiView
          from={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'timing', duration: 1000 }}
          style={[
            styles.progressBar,
            {
              backgroundColor:
                timer.status === 'completed'
                  ? '#10B981'
                  : timer.status === 'running'
                  ? '#007AFF'
                  : '#6B7280',
            },
          ]}
        />
      </View>
    );
  };

  const groupedTimers = groupTimersByCategory();

  return (
    <View style={styles.container}>
      {Object.keys(groupedTimers).length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#6B7280' }}>
            No timers found
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#9CA3AF',
              textAlign: 'center',
              marginTop: 5,
            }}
          >
            Add a new timer to get started.
          </Text>
        </View>
      ) : (
        Object.entries(groupedTimers).map(([category, categoryTimers]) => (
          <MotiView
            key={category}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.categoryContainer}
          >
            <Pressable
              style={({ pressed }) => [
                styles.categoryHeader,
                pressed && styles.categoryHeaderPressed,
              ]}
              onPress={() => toggleCategory(category)}
            >
              <LinearGradient
                colors={['#F9FAFB', '#F3F4F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.categoryHeaderGradient}
              >
                <View style={styles.categoryTitleContainer}>
                  <Ionicons
                    name={
                      expandedCategories.has(category)
                        ? 'chevron-down'
                        : 'chevron-forward'
                    }
                    size={24}
                    color="#007AFF"
                  />
                  <Text style={styles.categoryTitle}>{category}</Text>
                </View>
                <View style={styles.categoryActions}>
                  <TouchableOpacity
                    onPress={() => handleCategoryAction(category, 'start')}
                    style={styles.categoryAction}
                  >
                    <Ionicons name="play" size={20} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleCategoryAction(category, 'pause')}
                    style={styles.categoryAction}
                  >
                    <Ionicons name="pause" size={20} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleCategoryAction(category, 'reset')}
                    style={styles.categoryAction}
                  >
                    <Ionicons name="refresh" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Pressable>

            <AnimatePresence>
              {expandedCategories.has(category) && (
                <MotiView
                  from={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    type: 'timing',
                    duration: 300,
                  }}
                  style={styles.timersContainer}
                >
                  {categoryTimers.map((timer) => (
                    <MotiView
                      key={timer.id}
                      from={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 15 }}
                      style={styles.timerContainer}
                    >
                      <View style={styles.timerHeader}>
                        <Text style={styles.timerName}>{timer.name}</Text>
                        <Text
                          style={[
                            styles.timerTime,
                            {
                              color:
                                timer.status === 'completed'
                                  ? '#10B981'
                                  : timer.status === 'running'
                                  ? '#007AFF'
                                  : '#6B7280',
                            },
                          ]}
                        >
                          {formatTime(timer.remainingTime)}
                        </Text>
                      </View>
                      {renderProgressBar(timer)}
                      <View style={styles.timerControls}>
                        <TouchableOpacity
                          onPress={() => handleTimerAction(timer.id, 'start')}
                          disabled={
                            timer.status === 'running' ||
                            timer.status === 'completed'
                          }
                          style={[
                            styles.timerButton,
                            (timer.status === 'running' ||
                              timer.status === 'completed') &&
                              styles.disabledButton,
                          ]}
                        >
                          <Ionicons name="play" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleTimerAction(timer.id, 'pause')}
                          disabled={timer.status !== 'running'}
                          style={[
                            styles.timerButton,
                            timer.status !== 'running' && styles.disabledButton,
                          ]}
                        >
                          <Ionicons name="pause" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleTimerAction(timer.id, 'reset')}
                          style={styles.timerButton}
                        >
                          <Ionicons name="refresh" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </MotiView>
                  ))}
                </MotiView>
              )}
            </AnimatePresence>
          </MotiView>
        ))
      )}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <LinearGradient
          colors={['#007AFF', '#0056B3']}
          style={styles.addButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Add New Timer</Text>
            <TextInput
              style={styles.input}
              placeholder="Timer Name"
              value={newTimer.name}
              onChangeText={(text) => setNewTimer({ ...newTimer, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Duration (seconds)"
              value={newTimer.duration}
              onChangeText={(text) =>
                setNewTimer({ ...newTimer, duration: text })
              }
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Category"
              value={newTimer.category}
              onChangeText={(text) =>
                setNewTimer({ ...newTimer, category: text })
              }
            />
            <TouchableOpacity
              style={styles.halfwayAlertContainer}
              onPress={() =>
                setNewTimer({
                  ...newTimer,
                  halfwayAlert: !newTimer.halfwayAlert,
                })
              }
            >
              <Ionicons
                name={newTimer.halfwayAlert ? 'checkbox' : 'square-outline'}
                size={24}
                color="#007AFF"
              />
              <Text style={styles.halfwayAlertText}>Enable Halfway Alert</Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal]}
                onPress={handleAddTimer}
              >
                <Text style={styles.buttonText}>Add Timer</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </Modal>
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
  },
  categoryContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  categoryHeaderPressed: {
    opacity: 0.7,
  },
  categoryHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1F2937',
  },
  categoryActions: {
    flexDirection: 'row',
  },
  categoryAction: {
    marginLeft: 16,
    padding: 8,
  },
  timersContainer: {
    overflow: 'hidden',
  },
  timerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  timerTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  timerButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1F2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  halfwayAlertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  halfwayAlertText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  addButtonModal: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
