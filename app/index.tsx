// app/index.tsx — BHOOMI Premium Splash / Entry Screen
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  // Animation values
  const logoScale   = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoY       = useRef(new Animated.Value(40)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY       = useRef(new Animated.Value(24)).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;

  const ring1Scale   = useRef(new Animated.Value(0.6)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale   = useRef(new Animated.Value(0.4)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;

  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Outer glow rings pulse in first
    Animated.parallel([
      Animated.timing(ring1Opacity, {
        toValue: 0.15,
        duration: 600,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.spring(ring1Scale, {
        toValue: 1,
        delay: 100,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(ring2Opacity, {
        toValue: 0.08,
        duration: 700,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(ring2Scale, {
        toValue: 1,
        delay: 200,
        tension: 35,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo reveal
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        delay: 300,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoY, {
        toValue: 0,
        duration: 600,
        delay: 300,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Title slide-up
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        delay: 780,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleY, {
        toValue: 0,
        duration: 600,
        delay: 780,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Tagline fade
    Animated.timing(taglineOpacity, {
      toValue: 1,
      duration: 700,
      delay: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Loading dots pulse loop
    const pulseDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    setTimeout(() => {
      pulseDot(dot1Opacity, 0);
      pulseDot(dot2Opacity, 150);
      pulseDot(dot3Opacity, 300);
    }, 1400);
  }, []);

  return (
    <View style={styles.container}>
      {/* Deep gradient background */}
      <LinearGradient
        colors={['#020d08', '#031a0e', '#0a2618', '#0d3320']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient glow blob — top-right */}
      <View style={styles.glowBlobTopRight} />
      {/* Ambient glow blob — bottom-left */}
      <View style={styles.glowBlobBottomLeft} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>

          {/* Glow rings behind logo */}
          <View style={styles.logoWrapper}>
            <Animated.View
              style={[
                styles.ring2,
                { opacity: ring2Opacity, transform: [{ scale: ring2Scale }] },
              ]}
            />
            <Animated.View
              style={[
                styles.ring1,
                { opacity: ring1Opacity, transform: [{ scale: ring1Scale }] },
              ]}
            />

            {/* Logo icon */}
            <Animated.View
              style={[
                styles.logoCircle,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }, { translateY: logoY }],
                },
              ]}
            >
              {/* Leaf/sprout SVG-like shape using nested Views */}
              <View style={styles.leafIcon}>
                <View style={styles.leafStem} />
                <View style={styles.leafLeft} />
                <View style={styles.leafRight} />
              </View>
            </Animated.View>
          </View>

          {/* BHOOMI wordmark */}
          <Animated.Text
            style={[
              styles.title,
              { opacity: titleOpacity, transform: [{ translateY: titleY }] },
            ]}
          >
            BHOOMI
          </Animated.Text>

          {/* Tagline */}
          <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
            Intelligent Land. Empowered Farmers.
          </Animated.Text>

          {/* Loading dots */}
          <Animated.View style={[styles.dotsRow, { opacity: taglineOpacity }]}>
            <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
            <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
            <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
          </Animated.View>
        </View>

        {/* Bottom wordmark */}
        <Animated.Text style={[styles.bottomTag, { opacity: taglineOpacity }]}>
          AI-Powered Agriculture Intelligence
        </Animated.Text>
      </SafeAreaView>
    </View>
  );
}

const LOGO_SIZE = 110;
const RING1_SIZE = LOGO_SIZE + 60;
const RING2_SIZE = LOGO_SIZE + 120;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Ambient glow blobs
  glowBlobTopRight: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#10B981',
    opacity: 0.06,
  },
  glowBlobBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#34D399',
    opacity: 0.05,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },

  // Rings
  logoWrapper: {
    width: RING2_SIZE,
    height: RING2_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  ring2: {
    position: 'absolute',
    width: RING2_SIZE,
    height: RING2_SIZE,
    borderRadius: RING2_SIZE / 2,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  ring1: {
    position: 'absolute',
    width: RING1_SIZE,
    height: RING1_SIZE,
    borderRadius: RING1_SIZE / 2,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },

  // Logo circle
  logoCircle: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: '#0f3d22',
    borderWidth: 1.5,
    borderColor: '#1a5c35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },

  // Leaf icon (stylized using Views)
  leafIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafStem: {
    position: 'absolute',
    bottom: 2,
    width: 3,
    height: 24,
    backgroundColor: '#4ADE80',
    borderRadius: 2,
  },
  leafLeft: {
    position: 'absolute',
    bottom: 14,
    left: 8,
    width: 18,
    height: 26,
    backgroundColor: '#10B981',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
    transform: [{ rotate: '-20deg' }],
    opacity: 0.9,
  },
  leafRight: {
    position: 'absolute',
    bottom: 14,
    right: 8,
    width: 18,
    height: 26,
    backgroundColor: '#34D399',
    borderTopRightRadius: 16,
    borderTopLeftRadius: 4,
    borderBottomRightRadius: 4,
    transform: [{ rotate: '20deg' }],
    opacity: 0.85,
  },

  // Typography
  title: {
    fontSize: 52,
    fontWeight: '800',
    color: '#F0FDF4',
    letterSpacing: 10,
    marginBottom: 10,
    textShadowColor: 'rgba(16, 185, 129, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6EE7B7',
    letterSpacing: 0.8,
    opacity: 0.85,
    marginBottom: 40,
  },

  // Loading dots
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },

  // Bottom tag
  bottomTag: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    color: '#4ADE80',
    letterSpacing: 1.5,
    opacity: 0.5,
    paddingBottom: 24,
  },
});
