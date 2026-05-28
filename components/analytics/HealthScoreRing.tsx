import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Filter, FeDropShadow } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  withSpring,
  Easing,
  interpolateColor
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface HealthScoreRingProps {
  score: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export const HealthScoreRing: React.FC<HealthScoreRingProps> = ({ 
  score, 
  color, 
  size = 120, 
  strokeWidth = 10 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const animatedScore = useSharedValue(0);
  
  useEffect(() => {
    // Smooth transition for the score
    animatedScore.value = withTiming(score, {
      duration: 1200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [score]);

  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (circumference * animatedScore.value) / 100;
    return {
      strokeDashoffset,
    };
  });

  const svgSize = size + 20; // Extra space for shadow
  const center = svgSize / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={svgSize} height={svgSize} style={{ position: 'absolute' }}>
        <Defs>
          <Filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <FeDropShadow dx="0" dy="0" stdDeviation="6" floodColor={color} floodOpacity="0.5" />
          </Filter>
        </Defs>
        {/* Background Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`${color}20`}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Ring */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          strokeLinecap="round"
          originX={center}
          originY={center}
          rotation="-90"
          filter="url(#glow)"
        />
      </Svg>
      
      <View style={styles.textContainer}>
        <Text style={[styles.scoreText, { color }]}>{score}</Text>
        <Text style={styles.maxScoreText}>/100</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
  },
  maxScoreText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 2,
    fontWeight: '600',
  }
});
