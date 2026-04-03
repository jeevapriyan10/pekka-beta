import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../../theme';
import PekkaInput from '../../components/PekkaInput';
import PekkaButton from '../../components/PekkaButton';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function PhysicalStatsScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const profileData = route.params?.profileData || {};

  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [sex, setSex] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const age = useMemo(() => {
    const d = parseInt(dobDay);
    const m = parseInt(dobMonth);
    const y = parseInt(dobYear);
    if (!d || !m || !y || y < 1920 || y > 2015) return null;
    const today = new Date();
    const birth = new Date(y, m - 1, d);
    let a = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      a--;
    }
    return a > 0 && a < 120 ? a : null;
  }, [dobDay, dobMonth, dobYear]);

  const getHeightCm = (): number => {
    if (units === 'metric') {
      return parseFloat(heightCm) || 0;
    }
    const ft = parseFloat(heightFt) || 0;
    const inch = parseFloat(heightIn) || 0;
    return Math.round((ft * 12 + inch) * 2.54 * 10) / 10;
  };

  const getWeightKg = (): number => {
    const w = parseFloat(weight) || 0;
    return units === 'imperial' ? Math.round(w / 2.205 * 10) / 10 : w;
  };

  const getTargetWeightKg = (): number => {
    const tw = parseFloat(targetWeight) || 0;
    return units === 'imperial' ? Math.round(tw / 2.205 * 10) / 10 : tw;
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const h = getHeightCm();
    const w = getWeightKg();

    if (h < 100 || h > 250) errs.height = 'Height must be between 100–250 cm';
    if (w < 30 || w > 300) errs.weight = 'Weight must be between 30–300 kg';
    if (bodyFat) {
      const bf = parseFloat(bodyFat);
      if (isNaN(bf) || bf < 3 || bf > 60) errs.bodyFat = 'Body fat must be 3–60%';
    }
    if (!sex) errs.sex = 'Please select your sex';
    if (!age) errs.dob = 'Please enter a valid date of birth';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const canContinue = (units === 'metric' ? heightCm : (heightFt && heightIn)) && weight && sex && dobDay && dobMonth && dobYear;

  const handleContinue = () => {
    if (!validate()) return;

    const dobStr = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;

    navigation.navigate('TrainingExperience', {
      profileData: {
        ...profileData,
        units,
        height_cm: getHeightCm(),
        weight_kg: getWeightKg(),
        target_weight_kg: getTargetWeightKg() || getWeightKg(),
        body_fat_pct: parseFloat(bodyFat) || 0,
        dob: dobStr,
        sex,
        age,
      },
    });
  };

  const renderChip = (label: string, isActive: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      style={[styles.chip, isActive && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.step}>2 of 6</Text>
        <Text style={styles.title}>Physical Stats</Text>
        <Text style={styles.subtitle}>We'll calculate your TDEE and macro targets</Text>

        {/* Unit Toggle */}
        <View style={styles.unitToggle}>
          {renderChip('Metric', units === 'metric', () => setUnits('metric'))}
          {renderChip('Imperial', units === 'imperial', () => setUnits('imperial'))}
        </View>

        {/* Height */}
        {units === 'metric' ? (
          <PekkaInput
            label="Height (cm)"
            value={heightCm}
            onChangeText={setHeightCm}
            placeholder="e.g. 175"
            keyboardType="numeric"
            error={errors.height}
          />
        ) : (
          <View>
            <Text style={styles.fieldLabel}>Height</Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <PekkaInput
                  label="Feet"
                  value={heightFt}
                  onChangeText={setHeightFt}
                  placeholder="5"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <PekkaInput
                  label="Inches"
                  value={heightIn}
                  onChangeText={setHeightIn}
                  placeholder="10"
                  keyboardType="numeric"
                />
              </View>
            </View>
            {errors.height ? <Text style={styles.error}>{errors.height}</Text> : null}
          </View>
        )}

        {/* Weight */}
        <PekkaInput
          label={`Current Weight (${units === 'metric' ? 'kg' : 'lbs'})`}
          value={weight}
          onChangeText={setWeight}
          placeholder={units === 'metric' ? 'e.g. 75' : 'e.g. 165'}
          keyboardType="numeric"
          error={errors.weight}
        />

        {/* Target Weight */}
        <PekkaInput
          label={`Target Weight (${units === 'metric' ? 'kg' : 'lbs'})`}
          value={targetWeight}
          onChangeText={setTargetWeight}
          placeholder="Optional"
          keyboardType="numeric"
        />

        {/* Body Fat */}
        <PekkaInput
          label="Body Fat % (optional)"
          value={bodyFat}
          onChangeText={setBodyFat}
          placeholder="e.g. 15"
          keyboardType="numeric"
          error={errors.bodyFat}
        />

        {/* Date of Birth */}
        <Text style={styles.fieldLabel}>Date of Birth</Text>
        <View style={styles.row}>
          <View style={styles.thirdInput}>
            <PekkaInput
              label="Day"
              value={dobDay}
              onChangeText={(v) => setDobDay(v.replace(/\D/g, '').slice(0, 2))}
              placeholder="DD"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.thirdInput}>
            <PekkaInput
              label="Month"
              value={dobMonth}
              onChangeText={(v) => setDobMonth(v.replace(/\D/g, '').slice(0, 2))}
              placeholder="MM"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.thirdInput}>
            <PekkaInput
              label="Year"
              value={dobYear}
              onChangeText={(v) => setDobYear(v.replace(/\D/g, '').slice(0, 4))}
              placeholder="YYYY"
              keyboardType="numeric"
            />
          </View>
        </View>
        {age ? (
          <Text style={styles.ageText}>Age: {age} years</Text>
        ) : null}
        {errors.dob ? <Text style={styles.error}>{errors.dob}</Text> : null}

        {/* Sex */}
        <Text style={styles.fieldLabel}>Sex</Text>
        <View style={styles.sexRow}>
          {['Male', 'Female', 'Other'].map((s) =>
            renderChip(s, sex === s, () => setSex(s))
          )}
        </View>
        {errors.sex ? <Text style={styles.error}>{errors.sex}</Text> : null}

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <PekkaButton
            title="CONTINUE"
            onPress={handleContinue}
            disabled={!canContinue}
            style={styles.continueBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  step: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    color: Colors.blue,
    marginTop: 20,
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    marginBottom: 24,
  },
  unitToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.blueAlpha,
    borderColor: Colors.blue,
  },
  chipText: {
    fontSize: 14,
    color: Colors.textDim,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.blue,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  thirdInput: {
    flex: 1,
  },
  ageText: {
    fontSize: 14,
    color: Colors.blue,
    marginBottom: 16,
    marginTop: -8,
  },
  sexRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  error: {
    fontSize: 12,
    color: Colors.red,
    marginTop: -8,
    marginBottom: 12,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  continueBtn: {
    flex: 1,
    marginLeft: 20,
  },
});
