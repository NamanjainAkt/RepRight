import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  Linking,
  Platform,
} from 'react-native';
import {QuickPoseView} from '@quickpose/react-native';
import {QUICKPOSE_SDK_KEY} from './sdkConfig';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const FEATURE_CATEGORIES: Record<string, {label: string; feature: string}[]> = {
  Overlay: [
    {label: 'Whole Body', feature: 'overlay.wholeBody'},
    {label: 'Upper Body', feature: 'overlay.upperBody'},
    {label: 'Lower Body', feature: 'overlay.lowerBody'},
    {label: 'Left Arm', feature: 'overlay.arm.left'},
    {label: 'Right Arm', feature: 'overlay.arm.right'},
    {label: 'Left Leg', feature: 'overlay.leg.left'},
    {label: 'Right Leg', feature: 'overlay.leg.right'},
    {label: 'Shoulders', feature: 'overlay.shoulders'},
    {label: 'Arms', feature: 'overlay.arms'},
    {label: 'Legs', feature: 'overlay.legs'},
    {label: 'Hips', feature: 'overlay.hips'},
    {label: 'Show Points', feature: 'showPoints'},
  ],
  'Range of Motion': [
    {label: 'Left Shoulder', feature: 'rangeOfMotion.shoulder.left'},
    {label: 'Right Shoulder', feature: 'rangeOfMotion.shoulder.right'},
    {label: 'Left Elbow', feature: 'rangeOfMotion.elbow.left'},
    {label: 'Right Elbow', feature: 'rangeOfMotion.elbow.right'},
    {label: 'Left Hip', feature: 'rangeOfMotion.hip.left'},
    {label: 'Right Hip', feature: 'rangeOfMotion.hip.right'},
    {label: 'Left Knee', feature: 'rangeOfMotion.knee.left'},
    {label: 'Right Knee', feature: 'rangeOfMotion.knee.right'},
    {label: 'Neck', feature: 'rangeOfMotion.neck'},
    {label: 'Back', feature: 'rangeOfMotion.back'},
  ],
  Fitness: [
    {label: 'Squats', feature: 'fitness.squats'},
    {label: 'Push Ups', feature: 'fitness.pushUps'},
    {label: 'Jumping Jacks', feature: 'fitness.jumpingJacks'},
    {label: 'Sumo Squats', feature: 'fitness.sumoSquats'},
    {label: 'Lunges (Left)', feature: 'fitness.lunges.left'},
    {label: 'Lunges (Right)', feature: 'fitness.lunges.right'},
    {label: 'Sit Ups', feature: 'fitness.sitUps'},
    {label: 'Cobra Wings', feature: 'fitness.cobraWings'},
    {label: 'Plank', feature: 'fitness.plank'},
    {label: 'Bicep Curls', feature: 'fitness.bicepCurls'},
    {label: 'Leg Raises', feature: 'fitness.legRaises'},
    {label: 'Glute Bridge', feature: 'fitness.gluteBridge'},
    {label: 'Overhead Dumbbell Press', feature: 'fitness.overheadDumbbellPress'},
    {label: 'V-Ups', feature: 'fitness.vUps'},
    {label: 'Lateral Raises', feature: 'fitness.lateralRaises'},
    {label: 'Front Raises', feature: 'fitness.frontRaises'},
    {label: 'Side Lunges (Left)', feature: 'fitness.sideLunges.left'},
    {label: 'Side Lunges (Right)', feature: 'fitness.sideLunges.right'},
  ],
  Input: [
    {label: 'Raised Fingers', feature: 'raisedFingers'},
    {label: 'Thumbs Up', feature: 'thumbsUp'},
    {label: 'Thumbs Up/Down', feature: 'thumbsUpOrDown'},
  ],
};

const CATEGORY_NAMES = Object.keys(FEATURE_CATEGORIES);

const App = () => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_NAMES[0]);
  const [selectedFeatureIdx, setSelectedFeatureIdx] = useState(0);
  const [value, setValue] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [counter, setCounter] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const wasAboveThreshold = useRef(false);
  const gestureTimer = useRef<NodeJS.Timeout | null>(null);

  // Bottom Sheet Refs
  const categorySheetRef = useRef<BottomSheet>(null);
  const featureSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleUpdate = useCallback(
    (event: any) => {
      const {results, feedback: fb} = event.nativeEvent;
      
      // Hands-Free Control: Thumbs Up (Pause)
      const thumbsUp = results?.find((r: any) => r.feature === 'thumbsUp');
      if (thumbsUp && thumbsUp.value > 0.8) {
        if (!gestureTimer.current) {
          gestureTimer.current = setTimeout(() => {
            setIsPaused(p => !p);
            ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
          }, 1500);
        }
      } else {
        // Hands-Free Control: Raised Fingers (Next Exercise)
        const raisedFingers = results?.find((r: any) => r.feature === 'raisedFingers');
        if (raisedFingers && raisedFingers.value > 0.8 && !isPaused) {
          if (!gestureTimer.current) {
            gestureTimer.current = setTimeout(() => {
              setSelectedFeatureIdx(i => (i + 1) % features.length);
              setCounter(0);
              setStreak(0);
              ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
            }, 1500);
          }
        } else if (gestureTimer.current) {
          clearTimeout(gestureTimer.current);
          gestureTimer.current = null;
        }
      }

      if (isPaused) return;

      if (results && results.length > 0) {
        const v = results[0].value;
        setValue(v);

        if (isFitness && !isPlank) {
          if (v >= 0.5 && !wasAboveThreshold.current) {
            wasAboveThreshold.current = true;
          } else if (v < 0.3 && wasAboveThreshold.current) {
            wasAboveThreshold.current = false;
            
            // Intelligence: Streak & Quality Check
            const isGoodForm = !fb || fb.toLowerCase().includes('good');
            setCounter(c => c + 1);
            
            if (isGoodForm) {
              setStreak(s => s + 1);
              ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
            } else {
              setStreak(0);
              ReactNativeHapticFeedback.trigger('notificationWarning', hapticOptions);
            }
          }
        }
      }
      setFeedback(fb ?? null);
    },
    [isFitness, isPlank, isPaused],
  );

  const selectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedFeatureIdx(0);
    setValue(0);
    setCounter(0);
    setFeedback(null);
    wasAboveThreshold.current = false;
    categorySheetRef.current?.close();
  };

  const selectFeature = (idx: number) => {
    setSelectedFeatureIdx(idx);
    setValue(0);
    setCounter(0);
    setFeedback(null);
    wasAboveThreshold.current = false;
    featureSheetRef.current?.close();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <QuickPoseView
          sdkKey={QUICKPOSE_SDK_KEY}
          features={[currentFeature.feature, 'thumbsUp', 'raisedFingers']}
          useFrontCamera={true}
          style={styles.camera}
          onUpdate={handleUpdate}
        />

        <SafeAreaView style={styles.topControls}>
          <View style={styles.hudHeader}>
            <View>
              <Text style={styles.appName}>repright</Text>
              <Text style={styles.sessionTimer}>
                {isPaused ? 'PAUSED' : formatTime(sessionTime)}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {streak > 2 && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>🔥 {streak} STREAK</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.hudButton}
                onPress={() => categorySheetRef.current?.expand()}>
                <Text style={styles.hudButtonText}>{selectedCategory}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.hudButton}
                onPress={() => featureSheetRef.current?.expand()}>
                <Text style={styles.hudButtonText}>{currentFeature.label}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {!isPaused && (
          <View style={styles.coachingHUD}>
            <Text style={styles.coachingTitle}>AI COACH</Text>
            <Text style={styles.coachingTip}>
              {feedback ? feedback : "Ready? Let's go!"}
            </Text>
            <View style={styles.gestureHintRow}>
              <Text style={styles.gestureHint}>👍 Pause</Text>
              <Text style={styles.gestureHint}>🖐 Next</Text>
            </View>
          </View>
        )}

        {isPaused && (
          <View style={styles.pausedOverlay}>
            <Text style={styles.pausedText}>SESSION PAUSED</Text>
            <Text style={styles.pausedSubtext}>Hold Thumbs Up to Resume</Text>
          </View>
        )}

        <View style={styles.statsOverlay}>
          <View style={[
            styles.repCard,
            streak >= 5 && styles.repCardStreak
          ]}>
            {isFitness && !isPlank && (
              <>
                <Text style={[styles.repLabel, streak >= 5 && styles.repLabelStreak]}>
                  {streak >= 5 ? 'PERFECT REPS' : 'REPS'}
                </Text>
                <Text style={styles.repCount}>{counter}</Text>
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(value * 100, 100)}%`,
                        backgroundColor: !feedback || feedback.toLowerCase().includes('good') ? '#00F0FF' : '#FF3D3D'
                      },
                    ]}
                  />
                </View>
              </>
            )}
            {isPlank && (
              <>
                <Text style={styles.repLabel}>HOLD</Text>
                <Text style={styles.repCount}>{Math.round(value * 100)}%</Text>
              </>
            )}
            {isROM && (
              <>
                <Text style={styles.repLabel}>ANGLE</Text>
                <Text style={styles.repCount}>{Math.round(value)}°</Text>
              </>
            )}
          </View>
        </View>

        {feedback && (
          <View style={styles.feedbackHUD}>
            <View style={[
              styles.feedbackBadge,
              feedback.toLowerCase().includes('good') ? styles.feedbackGood : styles.feedbackAdjust
            ]}>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          </View>
        )}

        <SafeAreaView style={styles.bottomBranding}>
          <TouchableOpacity onPress={() => Linking.openURL('https://quickpose.ai')}>
            <Text style={styles.brandingText}>Powered by QuickPose.ai</Text>
          </TouchableOpacity>
        </SafeAreaView>

        <BottomSheet
          ref={categorySheetRef}
          index={-1}
          snapPoints={['50%']}
          enablePanDownToClose
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.sheetIndicator}>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Select Category</Text>
            <BottomSheetFlatList
              data={CATEGORY_NAMES}
              keyExtractor={item => item}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.sheetItem,
                    item === selectedCategory && styles.sheetItemSelected,
                  ]}
                  onPress={() => selectCategory(item)}>
                  <Text
                    style={[
                      styles.sheetItemText,
                      item === selectedCategory && styles.sheetItemTextSelected,
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </BottomSheet>

        <BottomSheet
          ref={featureSheetRef}
          index={-1}
          snapPoints={['60%']}
          enablePanDownToClose
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.sheetIndicator}>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>{selectedCategory}</Text>
            <BottomSheetFlatList
              data={features}
              keyExtractor={item => item.feature}
              renderItem={({item, index}) => (
                <TouchableOpacity
                  style={[
                    styles.sheetItem,
                    index === selectedFeatureIdx && styles.sheetItemSelected,
                  ]}
                  onPress={() => selectFeature(index)}>
                  <Text
                    style={[
                      styles.sheetItemText,
                      index === selectedFeatureIdx &&
                        styles.sheetItemTextSelected,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  appName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -1,
  },
  sessionTimer: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  hudButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  hudButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  repCard: {
    backgroundColor: 'rgba(20,20,25,0.85)',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 32,
    minWidth: 160,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  repLabel: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 6,
  },
  repCount: {
    color: 'white',
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 64,
  },
  progressContainer: {
    width: 120,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00F0FF', 
  },
  coachingHUD: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
    borderRadius: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00F0FF',
  },
  coachingTitle: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  coachingTip: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  gestureHintRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  gestureHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
  },
  feedbackHUD: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  feedbackBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  feedbackGood: {
    backgroundColor: '#00D361',
  },
  feedbackAdjust: {
    backgroundColor: '#FF3D3D',
  },
  feedbackText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  streakBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  streakText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pausedText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  pausedSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  repCardStreak: {
    borderColor: '#FFD700',
    borderWidth: 2,
    backgroundColor: 'rgba(40,35,0,0.9)',
  },
  repLabelStreak: {
    color: '#FFD700',
  },
  sheetBackground: {
    backgroundColor: '#1C1C1E',
  },
  sheetIndicator: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 40,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  sheetItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sheetItemSelected: {
    backgroundColor: 'rgba(0,240,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.3)',
  },
  sheetItemText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  sheetItemTextSelected: {
    color: '#00F0FF',
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  modalItemSelected: {
    backgroundColor: '#eef0fe',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemTextSelected: {
    color: '#5970F6',
    fontWeight: '600',
  },
  modalClose: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#999',
  },
  bottomBranding: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 12,
  },
  brandingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default App;
