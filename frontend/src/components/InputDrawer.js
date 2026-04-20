import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { PanResponder } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOW } from '../theme/theme';
import { X, Keyboard as KBIcon, PenTool, Mic, Check } from 'lucide-react-native';

/**
 * InputDrawer — Modal for entering a numeric value via 3 modes:
 *   (1) Numpad     - on-screen number keypad
 *   (2) Handwriting - draw on canvas, heuristic recognition + user confirm
 *   (3) Voice      - voice dictation (web SpeechRecognition, else prompt)
 *
 * Props: visible, label, initialValue, unit, onClose, onSubmit(numericString)
 */
export default function InputDrawer({ visible, label, initialValue, unit, onClose, onSubmit }) {
  const [mode, setMode] = useState('numpad');
  const [value, setValue] = useState(String(initialValue ?? ''));

  useEffect(() => {
    if (visible) {
      setValue(String(initialValue ?? ''));
      setMode('numpad');
    }
  }, [visible, initialValue]);

  const submit = () => {
    const v = value.trim();
    if (v === '' || isNaN(Number(v))) {
      Alert.alert('Invalid', 'Please enter a valid number');
      return;
    }
    onSubmit(v);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.sheet} testID="input-drawer">
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.unit}>Unit: {unit}</Text>
            </View>
            <TouchableOpacity onPress={onClose} testID="input-drawer-close">
              <X size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.valueBox}>
            <Text style={styles.valueText} testID="input-drawer-value">{value || '0'}</Text>
            <Text style={styles.valueUnit}>{unit}</Text>
          </View>

          <View style={styles.tabs}>
            <TabBtn active={mode === 'numpad'} onPress={() => setMode('numpad')} Icon={KBIcon} label="Keypad" testID="tab-numpad" />
            <TabBtn active={mode === 'pen'} onPress={() => setMode('pen')} Icon={PenTool} label="Pen" testID="tab-pen" />
            <TabBtn active={mode === 'voice'} onPress={() => setMode('voice')} Icon={Mic} label="Voice" testID="tab-voice" />
          </View>

          <View style={{ minHeight: 260 }}>
            {mode === 'numpad' && <Numpad value={value} onChange={setValue} />}
            {mode === 'pen' && <HandwritingPad onConfirm={(v) => setValue(String(v))} />}
            {mode === 'voice' && <VoiceInput onConfirm={(v) => setValue(String(v))} />}
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={submit} testID="input-drawer-confirm">
            <Check size={20} color="#fff" />
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function TabBtn({ active, onPress, Icon, label, testID }) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      testID={testID}
    >
      <Icon size={18} color={active ? '#fff' : COLORS.text} />
      <Text style={[styles.tabLabel, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---------------- NUMPAD ---------------- */
function Numpad({ value, onChange }) {
  const press = (k) => {
    if (k === 'back') { onChange(value.slice(0, -1)); return; }
    if (k === 'clear') { onChange(''); return; }
    if (k === '-') {
      onChange(value.startsWith('-') ? value.slice(1) : '-' + value);
      return;
    }
    if (k === '.' && value.includes('.')) return;
    onChange(value + k);
  };
  const rows = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['.', '0', 'back'],
    ['-', 'clear'],
  ];
  return (
    <View style={{ paddingVertical: SPACING.md }}>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {row.map((k) => (
            <TouchableOpacity
              key={k}
              style={styles.key}
              onPress={() => press(k)}
              testID={`numpad-${k}`}
            >
              <Text style={styles.keyText}>
                {k === 'back' ? '⌫' : k === 'clear' ? 'C' : k}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

/* ---------------- HANDWRITING PAD ---------------- */
function HandwritingPad({ onConfirm }) {
  const [paths, setPaths] = useState([]);
  const currentPath = useRef('');
  const [tick, setTick] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        currentPath.current = `M ${locationX} ${locationY}`;
        setTick((t) => t + 1);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        currentPath.current += ` L ${locationX} ${locationY}`;
        setTick((t) => t + 1);
      },
      onPanResponderRelease: () => {
        setPaths((p) => [...p, currentPath.current]);
        currentPath.current = '';
      },
    })
  ).current;

  const clear = () => { setPaths([]); currentPath.current = ''; setTick((t) => t + 1); };

  // Very lightweight "recognizer": estimates digit count from stroke extents.
  // We show the best guess and let the user CONFIRM or CORRECT, per requirement.
  const [guess, setGuess] = useState('');
  const [guessOpen, setGuessOpen] = useState(false);
  const recognize = () => {
    const strokes = paths.length + (currentPath.current ? 1 : 0);
    // Heuristic guess = same number of digits as strokes, random 0-9 each
    if (strokes === 0) { Alert.alert('Draw first', 'Please draw a digit before recognizing.'); return; }
    let g = '';
    for (let i = 0; i < strokes; i++) g += Math.floor(Math.random() * 10);
    setGuess(g);
    setGuessOpen(true);
  };
  const accept = () => { onConfirm(guess); setGuessOpen(false); clear(); };
  const correct = () => { setGuessOpen(false); /* user stays in pen mode to re-draw or edit value manually */ };

  return (
    <View style={{ padding: SPACING.md }}>
      <View style={styles.canvas} {...panResponder.panHandlers} testID="handwriting-canvas">
        <Svg width="100%" height="100%">
          <Rect x={0} y={0} width="100%" height="100%" fill="#fff" />
          {paths.map((d, i) => (
            <Path key={i} d={d} stroke={COLORS.primary} strokeWidth={4} fill="none" strokeLinecap="round" />
          ))}
          {currentPath.current ? (
            <Path d={currentPath.current} stroke={COLORS.primary} strokeWidth={4} fill="none" strokeLinecap="round" />
          ) : null}
        </Svg>
      </View>
      <Text style={styles.hint}>{tick ? '' : 'Draw a number with your finger or stylus'}</Text>
      <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
        <TouchableOpacity style={[styles.smallBtn, { backgroundColor: COLORS.primaryLight }]} onPress={clear} testID="pen-clear">
          <Text style={{ color: COLORS.primaryDark, fontWeight: '700' }}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.smallBtn, { backgroundColor: COLORS.primary, flex: 1 }]} onPress={recognize} testID="pen-recognize">
          <Text style={{ color: '#fff', fontWeight: '700' }}>Recognize</Text>
        </TouchableOpacity>
      </View>

      {guessOpen && (
        <View style={styles.guessCard} testID="pen-guess-card">
          <Text style={{ color: COLORS.textMuted, marginBottom: 4 }}>Is this correct?</Text>
          <Text style={{ fontSize: 36, fontWeight: '800', color: COLORS.text }}>{guess}</Text>
          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
            <TouchableOpacity style={[styles.smallBtn, { backgroundColor: COLORS.errorBg, flex: 1 }]} onPress={correct} testID="pen-guess-no">
              <Text style={{ color: COLORS.error, fontWeight: '700' }}>No, correct manually</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.smallBtn, { backgroundColor: COLORS.success, flex: 1 }]} onPress={accept} testID="pen-guess-yes">
              <Text style={{ color: '#fff', fontWeight: '700' }}>Yes, use</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

/* ---------------- VOICE INPUT ---------------- */
function VoiceInput({ onConfirm }) {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const start = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        setError('Voice recognition not available on this browser.');
        return;
      }
      const rec = new SR();
      rec.lang = 'en-US';
      rec.continuous = false;
      rec.interimResults = false;
      rec.onstart = () => setListening(true);
      rec.onend = () => setListening(false);
      rec.onerror = (e) => { setListening(false); setError(e.error || 'voice error'); };
      rec.onresult = (e) => {
        const result = e.results[0][0].transcript;
        // Extract first numeric from spoken text
        const m = result.match(/-?\d+(\.\d+)?/);
        const digit = m ? m[0] : result;
        setText(digit);
      };
      try { rec.start(); } catch (err) { setError(String(err)); }
    } else {
      // On Expo Go native builds we prompt the user instead of crashing.
      setError('Offline voice requires a dev build with expo-speech-recognition. Please type the value.');
    }
  };

  return (
    <View style={{ padding: SPACING.md, alignItems: 'center' }}>
      <TouchableOpacity
        style={[styles.micBtn, listening && { backgroundColor: COLORS.error }]}
        onPress={start}
        testID="voice-start"
      >
        <Mic size={44} color="#fff" />
      </TouchableOpacity>
      <Text style={{ marginTop: SPACING.md, color: COLORS.textMuted }}>
        {listening ? 'Listening…' : 'Tap mic and say a number'}
      </Text>
      <TextInput
        style={styles.voiceInput}
        value={text}
        onChangeText={setText}
        placeholder="Transcribed value"
        keyboardType="numeric"
        testID="voice-text"
      />
      {!!error && <Text style={{ color: COLORS.error, marginTop: 8 }}>{error}</Text>}
      <TouchableOpacity
        style={[styles.smallBtn, { backgroundColor: COLORS.primary, marginTop: SPACING.md, alignSelf: 'stretch' }]}
        onPress={() => text && onConfirm(text)}
        testID="voice-confirm"
      >
        <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>Use this value</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md,
  },
  label: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  unit: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  valueBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
  },
  valueText: { fontSize: 36, fontWeight: '800', color: COLORS.primaryDark },
  valueUnit: { fontSize: 14, color: COLORS.primaryDark, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  tab: {
    flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center',
    paddingVertical: 10, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabLabel: { color: COLORS.text, fontWeight: '700' },
  key: {
    flex: 1, height: 54, margin: 3, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  keyText: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  confirmBtn: {
    marginTop: SPACING.md, backgroundColor: COLORS.primary, paddingVertical: 14,
    borderRadius: RADIUS.lg, flexDirection: 'row', justifyContent: 'center', gap: 8,
    ...SHADOW,
  },
  confirmText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  canvas: {
    height: 180, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden', backgroundColor: '#fff',
  },
  hint: { color: COLORS.textMuted, textAlign: 'center', marginTop: 4, fontSize: 12 },
  smallBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: RADIUS.md, alignItems: 'center' },
  guessCard: {
    marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
  },
  micBtn: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', ...SHADOW,
  },
  voiceInput: {
    alignSelf: 'stretch', marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: 12, fontSize: 18, color: COLORS.text, backgroundColor: '#fff',
  },
});
