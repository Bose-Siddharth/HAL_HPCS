import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  ChevronLeft, Settings as SettingsIcon, Mountain, Thermometer, Fuel, Package, User, Gauge, Weight,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING, SHADOW } from '../src/theme/theme';
import { useAppState } from '../src/store/AppState';
import { fromBaseUnit, toBaseUnit } from '../src/config/logic';
import InputDrawer from '../src/components/InputDrawer';

const HELI_IMG = {
  chetak: 'https://images.unsplash.com/photo-1758292581042-21a187fbbdd4?crop=entropy&cs=srgb&fm=jpg&w=400&q=80',
  cheetah: 'https://images.unsplash.com/photo-1759610314761-855c55114110?crop=entropy&cs=srgb&fm=jpg&w=400&q=80',
  cheetal: 'https://images.pexels.com/photos/5620366/pexels-photo-5620366.jpeg?auto=compress&cs=tinysrgb&w=400',
};

export default function Calculations() {
  const router = useRouter();
  const {
    aircraftDefaults, selectedAircraftId, setSelectedAircraftId,
    inputs, setInputs, units, setUnit, outputs,
  } = useAppState();

  const [drawer, setDrawer] = useState(null); // {field, label, unit, value}

  const openDrawer = (field, label, unit, value) => setDrawer({ field, label, unit, value });
  const closeDrawer = () => setDrawer(null);
  const onSubmitVal = (v) => {
    if (!drawer) return;
    const num = parseFloat(v);
    if (isNaN(num)) return;
    // All inputs are stored in base units (ft, °C, kg, hPa); convert from displayed unit
    const base = toBaseUnit(num, drawer.unit);
    setInputs({ [drawer.field]: base });
    closeDrawer();
    Toast.show({ type: 'success', text1: `${drawer.label} updated`, position: 'bottom', visibilityTime: 1200 });
  };

  const compute = () => {
    if (outputs.status === 'NOT_FIT') {
      Toast.show({ type: 'error', text1: 'Limit Exceeded', text2: outputs.reasons[0] || 'Check parameters', position: 'top' });
    } else {
      Toast.show({ type: 'success', text1: 'Within Limits', text2: 'Operational Status: Normal', position: 'top' });
    }
    router.push('/results');
  };

  const display = (val, unit) => {
    if (val === null || val === undefined || val === '') return '';
    const n = fromBaseUnit(val, unit);
    return isFinite(n) ? (Math.round(n * 100) / 100).toString() : '';
  };

  const airframes = ['chetak', 'cheetah', 'cheetal'];

  return (
    <SafeAreaView style={styles.root} edges={['top']} testID="calculations-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }} testID="back-btn">
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Helicopter Performance System</Text>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerBtn} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }} testID="header-settings-btn">
          <SettingsIcon size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Airframe selector */}
          <Text style={styles.sectionTitle}>Select Airframe</Text>
          <Text style={styles.sectionSub}>Choose the helicopter type to check performance profile.</Text>
          <View style={styles.airframeRow}>
            {airframes.map((id) => {
              const active = id === selectedAircraftId;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => setSelectedAircraftId(id)}
                  style={[styles.airframeCard, active && styles.airframeCardActive]}
                  testID={`airframe-${id}`}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: HELI_IMG[id] }} style={styles.airframeImg} resizeMode="cover" />
                  <Text style={[styles.airframeName, active && { color: COLORS.primaryDark }]}>
                    {aircraftDefaults[id].name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Operational inputs */}
          <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Operational Inputs</Text>
          <Text style={styles.sectionSub}>Enter operating conditions to calculate aircraft limits.</Text>

          <InputRow
            Icon={Mountain}
            label="Elevation"
            value={display(inputs.elevation, units.altitude)}
            unit={units.altitude}
            unitOptions={['ft', 'm']}
            onUnitChange={(u) => setUnit('altitude', u)}
            onPress={() => openDrawer('elevation', 'Elevation', units.altitude, display(inputs.elevation, units.altitude))}
            testID="input-elevation"
          />
          <InputRow
            Icon={Gauge}
            label="QNH"
            value={display(inputs.qnh, units.pressure)}
            unit={units.pressure === 'hPa' ? 'mb' : units.pressure}
            unitOptions={['hPa', 'inHg']}
            unitLabels={{ hPa: 'mb', inHg: 'inHg' }}
            onUnitChange={(u) => setUnit('pressure', u)}
            onPress={() => openDrawer('qnh', 'QNH', units.pressure === 'hPa' ? 'mb' : units.pressure, display(inputs.qnh, units.pressure))}
            testID="input-qnh"
          />
          <InputRow
            Icon={Thermometer}
            label="Temperature"
            value={display(inputs.temperature, units.temperature)}
            unit={units.temperature === 'C' ? '°C' : '°F'}
            unitOptions={['C', 'F']}
            unitLabels={{ C: '°C', F: '°F' }}
            onUnitChange={(u) => setUnit('temperature', u)}
            onPress={() => openDrawer('temperature', 'Temperature', units.temperature === 'C' ? 'C' : 'F', display(inputs.temperature, units.temperature))}
            testID="input-temperature"
          />
          <InputRow
            Icon={Weight}
            label="AC Weight"
            value={display(inputs.acWeight, 'lb')}
            unit="lb"
            onPress={() => openDrawer('acWeight', 'AC Weight', 'lb', display(inputs.acWeight, 'lb'))}
            testID="input-ac-weight"
          />
          <InputRow
            Icon={User}
            label="Crew Weight"
            value={display(inputs.crewWeight, 'kg')}
            unit="kg"
            onPress={() => openDrawer('crewWeight', 'Crew Weight', 'kg', display(inputs.crewWeight, 'kg'))}
            testID="input-crew"
          />
          <InputRow
            Icon={Fuel}
            label="Fuel"
            value={display(inputs.fuel, 'L')}
            unit="L"
            onPress={() => openDrawer('fuel', 'Fuel', 'L', display(inputs.fuel, 'L'))}
            testID="input-fuel"
          />
          <InputRow
            Icon={Package}
            label="Additional Load"
            value={display(inputs.additionalLoad, 'kg')}
            unit="kg"
            onPress={() => openDrawer('additionalLoad', 'Additional Load', 'kg', display(inputs.additionalLoad, 'kg'))}
            testID="input-add-load"
          />
          <InputRow
            Icon={Package}
            label="Load"
            value={display(inputs.payload, 'kg')}
            unit="kg"
            onPress={() => openDrawer('payload', 'Load', 'kg', display(inputs.payload, 'kg'))}
            testID="input-payload"
          />

          {/* Live preview of outputs */}
          <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Live Preview</Text>
          <View style={styles.previewGrid}>
            <PreviewCell k="PA" v={`${outputs.PA} ft`} />
            <PreviewCell k="ISA Temp" v={`${outputs.ISA_TEMP} °C`} />
            <PreviewCell k="Density Alt" v={`${outputs.DENSITY_ALT} ft`} />
            <PreviewCell k="Abs Temp" v={`${outputs.ABS_TEMP} K`} />
            <PreviewCell k="AUW" v={`${outputs.AUW} lb`} />
            <PreviewCell k="Power Avail" v={`${outputs.POWER_AVAIL}`} />
            <PreviewCell k="Power Req" v={`${outputs.POWER_REQ}`} />
            <PreviewCell k="Pwr Balance" v={`${outputs.POWER_BALANCE_PCT}%`} />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.computeBtn} onPress={compute} testID="compute-performance-btn" activeOpacity={0.9}>
            <Text style={styles.computeText}>Compute Performance</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <InputDrawer
        visible={!!drawer}
        label={drawer?.label || ''}
        initialValue={drawer?.value}
        unit={drawer?.unit === 'C' ? '°C' : drawer?.unit === 'F' ? '°F' : drawer?.unit}
        onClose={closeDrawer}
        onSubmit={onSubmitVal}
      />
    </SafeAreaView>
  );
}

function InputRow({ Icon, label, value, unit, unitOptions, unitLabels, onUnitChange, onPress, testID }) {
  return (
    <View style={styles.inputBlock}>
      <View style={styles.inputLabelRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        {unitOptions && (
          <View style={styles.unitToggle}>
            {unitOptions.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitPill, unit === (unitLabels?.[u] ?? u) || unit === u ? styles.unitPillActive : null]}
                onPress={() => onUnitChange(u)}
                testID={`${testID}-unit-${u}`}
              >
                <Text style={[styles.unitPillText, unit === (unitLabels?.[u] ?? u) || unit === u ? { color: '#fff' } : null]}>
                  {unitLabels?.[u] ?? u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.inputRow} onPress={onPress} activeOpacity={0.8} testID={testID}>
        <Icon size={20} color={COLORS.primaryDark} />
        {value ? (
          <Text style={styles.inputValue}>{value}</Text>
        ) : (
          <Text style={styles.inputPlaceholder}>Enter value</Text>
        )}
        <Text style={styles.inputUnit}>{unit}</Text>
      </TouchableOpacity>
    </View>
  );
}

function PreviewCell({ k, v }) {
  return (
    <View style={styles.previewCell}>
      <Text style={styles.previewK}>{k}</Text>
      <Text style={styles.previewV}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md, backgroundColor: COLORS.primary,
    gap: SPACING.sm, borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 17, flex: 1 },
  scroll: { flex: 1 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: -0.3 },
  sectionSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 2, marginBottom: SPACING.md },
  airframeRow: { flexDirection: 'row', gap: SPACING.sm },
  airframeCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.sm,
    borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', ...SHADOW,
  },
  airframeCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  airframeImg: { width: '100%', height: 66, borderRadius: 8, backgroundColor: COLORS.bg },
  airframeName: { marginTop: 6, fontWeight: '800', color: COLORS.text },
  inputBlock: { marginBottom: SPACING.md },
  inputLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  inputLabel: { fontWeight: '800', color: COLORS.text, fontSize: 14 },
  unitToggle: {
    flexDirection: 'row', backgroundColor: COLORS.bg, borderRadius: 999, padding: 3,
    borderWidth: 1, borderColor: COLORS.border,
  },
  unitPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  unitPillActive: { backgroundColor: COLORS.primary },
  unitPillText: { color: COLORS.textMuted, fontWeight: '800', fontSize: 12 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.md, ...SHADOW,
  },
  inputValue: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.text },
  inputPlaceholder: { flex: 1, fontSize: 16, fontWeight: '500', color: '#94A3B8' },
  inputUnit: { color: COLORS.textMuted, fontWeight: '700' },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  previewCell: {
    width: '48%', backgroundColor: COLORS.card, padding: SPACING.md,
    borderRadius: RADIUS.md, ...SHADOW,
  },
  previewK: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  previewV: { marginTop: 4, fontSize: 16, fontWeight: '800', color: COLORS.text },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SPACING.lg, backgroundColor: 'rgba(245,247,251,0.95)',
  },
  computeBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: RADIUS.lg,
    alignItems: 'center', ...SHADOW,
  },
  computeText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },
});
