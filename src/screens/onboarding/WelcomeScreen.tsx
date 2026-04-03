import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../../theme';
import PekkaInput from '../../components/PekkaInput';
import PekkaButton from '../../components/PekkaButton';

export default function WelcomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateUsername = (value: string) => {
    const cleaned = value.toLowerCase().replace(/\s/g, '');
    setUsername(cleaned);
    if (cleaned && (/\s/.test(value) || value !== value.toLowerCase())) {
      setErrors(prev => ({ ...prev, username: 'Username must be lowercase with no spaces' }));
    } else {
      setErrors(prev => ({ ...prev, username: '' }));
    }
  };

  const validateEmail = (value: string) => {
    setEmail(value);
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not access photo library');
    }
  };

  const canContinue =
    name.trim().length > 0 &&
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    !errors.username &&
    !errors.email;

  const handleContinue = () => {
    if (!canContinue) return;
    navigation.navigate('PhysicalStats', {
      profileData: {
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        profilePhoto,
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['rgba(0,212,255,0.08)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>P.E.K.K.A</Text>
          <Text style={styles.betaLabel}>BETA</Text>
          <Text style={styles.subtitle}>
            Performance · Endurance · Kinetics · Achievement
          </Text>
        </View>

        {/* Tagline Card */}
        <View style={styles.taglineCard}>
          <Text style={styles.taglineText}>
            The world's first competitive fitness universe. Track, train, fuel — and rise through the ranks.
          </Text>
        </View>

        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera-outline" size={24} color={Colors.textDim} />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="add" size={14} color={Colors.bg} />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Add a photo (optional)</Text>
        </View>

        {/* Input Fields */}
        <PekkaInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
        />

        <PekkaInput
          label="Username"
          value={username}
          onChangeText={validateUsername}
          placeholder="@username"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.username}
        />

        <PekkaInput
          label="Email"
          value={email}
          onChangeText={validateEmail}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.email}
        />

        {/* Continue Button */}
        <PekkaButton
          title="CONTINUE"
          onPress={handleContinue}
          disabled={!canContinue}
          style={styles.continueButton}
        />
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
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  logoText: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: 12,
    color: Colors.white,
  },
  betaLabel: {
    fontSize: 11,
    letterSpacing: 6,
    color: Colors.blue,
    fontWeight: '600',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 12,
    textAlign: 'center',
  },
  taglineCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  taglineText: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 8,
  },
  continueButton: {
    marginTop: 12,
  },
});
