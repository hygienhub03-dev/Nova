import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ExpoOrbView, setOrbActivity } from 'expo-orb';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';

interface OrbProps {
  size?: number;
  active?: boolean;
  processing?: boolean;
}

export default function Orb({ size = 120, active = true, processing = false }: OrbProps) {
  const scale = useSharedValue(1);
  const animatedScale = useSharedValue(1);

  React.useEffect(() => {
    if (processing) {
      animatedScale.value = withSpring(1.3, { damping: 8 });
      setOrbActivity(0.6);
    } else if (active) {
      animatedScale.value = withSpring(1.1, { damping: 8 });
      setOrbActivity(0.4);
    } else {
      animatedScale.value = withSpring(1, { damping: 10 });
      setOrbActivity(0.1);
    }
  }, [active, processing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animatedScale.value }],
  }));

  return (
    <Animated.View style={[styles.orbContainer, { width: size, height: size }, animatedStyle]}>
      <ExpoOrbView
        style={[styles.orb, { width: size * 0.8, height: size * 0.8 }]}
        backgroundColors={['#7c3aed', '#3b82f6', '#ec4899']}
        glowColor="#60a5fa"
        particleColor="#ffffff"
        showBackground={true}
        showWavyBlobs={!processing}
        showParticles={!processing}
        showGlowEffects={true}
        showShadow={true}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    borderRadius: 9999,
  },
});