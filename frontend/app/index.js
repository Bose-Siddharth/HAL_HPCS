import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, FolderClock, Settings as SettingsIcon } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING, SHADOW } from '../src/theme/theme';

export default function Landing() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root} testID="landing-screen">
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* Top sky panel */}
        <View style={styles.skyPanel}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/reports')} testID="open-reports-btn">
              <FolderClock size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')} testID="open-settings-btn">
              <SettingsIcon size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* HAL Logo badge (text-based; replace with bundled asset at deploy time) */}
          <View style={styles.logoCard} testID="hal-logo">
            <Text style={styles.halBig}>HAL</Text>
            <Text style={styles.halSmall}>हिंदुस्तान</Text>
          </View>

          <Text style={styles.appTitle} testID="landing-title">Helicopter Performance System</Text>
          <Text style={styles.appSub}>Hindustan Aeronautics Limited</Text>

          {/* Made in India tricolour badge */}
          <View style={styles.miiBadge} testID="made-in-india-logo">
            <View style={[styles.miiBar, { backgroundColor: '#FF9933' }]} />
            <View style={[styles.miiBar, { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.miiBar, { backgroundColor: '#046A38' }]} />
            <Text style={styles.miiText}>MADE IN INDIA</Text>
          </View>
        </View>

        {/* Main CTA card */}
        <View style={styles.card}>
          <Text style={styles.pillLabel}>OFFLINE · TABLET · MOBILE</Text>
          <Text style={styles.heading}>Aviation-Grade Performance Calculator</Text>
          <Text style={styles.body}>
            Compute pressure altitude, density altitude, all-up-weight and power margins for Chetak, Cheetah and Cheetal helicopters — fully offline.
          </Text>

          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push('/calculations')}
            testID="proceed-to-calculation-btn"
            activeOpacity={0.9}
          >
            <Text style={styles.ctaText}>Proceed to Calculation</Text>
            <ChevronRight size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.featureRow}>
            <FeatureItem label="Offline SQLite" />
            <FeatureItem label="PDF Reports" />
            <FeatureItem label="Voice & Pen Input" />
          </View>
        </View>

        <Text style={styles.version}>v1.0.0 · Offline · HAL India</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({ label }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureDot} />
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flexGrow: 1 },
  skyPanel: {
    backgroundColor: COLORS.primary,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topBar: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoCard: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#fff', alignSelf: 'center', marginTop: SPACING.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#FFD54F',
    ...SHADOW,
  },
  halBig: { fontSize: 40, fontWeight: '900', color: COLORS.primaryDark, letterSpacing: 4 },
  halSmall: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1, marginTop: 2 },
  appTitle: {
    color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center',
    marginTop: SPACING.lg, letterSpacing: -0.5,
  },
  appSub: {
    color: '#E0F2FE', fontSize: 13, textAlign: 'center',
    fontWeight: '600', marginTop: 4, letterSpacing: 2, textTransform: 'uppercase',
  },
  miiBadge: {
    alignSelf: 'center', marginTop: SPACING.lg, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 4, paddingVertical: 4, gap: 4,
    ...SHADOW,
  },
  miiBar: { width: 14, height: 14, borderRadius: 3, borderWidth: 1, borderColor: '#E2E8F0' },
  miiText: { color: '#0F172A', fontWeight: '900', letterSpacing: 2, fontSize: 12, paddingHorizontal: 10 },
  card: {
    backgroundColor: COLORS.card, margin: SPACING.lg, borderRadius: RADIUS.lg, padding: SPACING.xl,
    ...SHADOW,
  },
  pillLabel: {
    color: COLORS.primaryDark, fontSize: 11, fontWeight: '800',
    letterSpacing: 1.5, marginBottom: SPACING.sm,
  },
  heading: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: -0.4 },
  body: { color: COLORS.textMuted, marginTop: SPACING.sm, lineHeight: 20, fontSize: 14 },
  cta: {
    marginTop: SPACING.xl, backgroundColor: COLORS.primary, paddingVertical: 18,
    borderRadius: RADIUS.lg, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: SPACING.sm, ...SHADOW,
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xl },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  featureText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  version: {
    textAlign: 'center', color: '#E0F2FE', fontSize: 11, marginTop: SPACING.sm, marginBottom: SPACING.lg,
  },
});
