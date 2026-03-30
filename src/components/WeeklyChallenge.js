import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../context';
import { typography, spacing, fonts } from '../constants';

// Rotating weekly challenges — each one encourages trying something new
const CHALLENGES = [
  {
    title: 'Grandpa Style Week',
    description: 'Skip the gaiwan. Toss leaves in a tall glass, add hot water, sip as it cools. Top off and repeat.',
    teaType: 'green',
    tip: 'Try with longjing or bi luo chun',
  },
  {
    title: 'Cold Brew Challenge',
    description: 'Put 5g of loose leaf in cold water overnight. Wake up to something smooth and sweet.',
    teaType: 'any',
    tip: 'Works great with jasmine green or fruity oolongs',
  },
  {
    title: 'Gongfu Deep Dive',
    description: 'Pick one tea and do 8+ infusions. Track how the flavor changes with each steep.',
    teaType: 'oolong',
    tip: 'Increase steep time by 5-10s each round',
  },
  {
    title: 'No Repeat Week',
    description: 'Brew a different tea every day this week. How many unique teas can you try?',
    teaType: 'any',
    tip: 'Check your collection for teas you haven\'t brewed recently',
  },
  {
    title: 'Temperature Experiment',
    description: 'Brew the same tea at 3 different temperatures. Notice how heat changes the flavor.',
    teaType: 'green',
    tip: 'Try 160°F, 175°F, and 195°F with the same green tea',
  },
  {
    title: 'Pu-erh Week',
    description: 'Spend the week with pu-erh. Try both sheng (raw) and shou (ripe) if you can.',
    teaType: 'puerh',
    tip: 'Rinse the leaves with a quick hot water pour before your first steep',
  },
  {
    title: 'Morning Ritual Reset',
    description: 'Replace your morning coffee with tea for the whole week. Journal each session.',
    teaType: 'black',
    tip: 'Assam and Yunnan blacks have the most body',
  },
  {
    title: 'Flavor Notes Focus',
    description: 'Really pay attention this week. Can you identify 3+ distinct flavors in each cup?',
    teaType: 'any',
    tip: 'Use the flavor tags after each brew to build your palate',
  },
  {
    title: 'White Tea Appreciation',
    description: 'Slow down with white tea this week. Lower temps, longer steeps, gentle flavors.',
    teaType: 'white',
    tip: 'Silver Needle at 170°F for 3 minutes is a great starting point',
  },
  {
    title: 'Tea & Food Pairing',
    description: 'Pair a different tea with each meal this week. Notice what complements what.',
    teaType: 'any',
    tip: 'Try oolong with rich foods, green tea with light dishes',
  },
];

// Deterministic weekly rotation: week number of the year → challenge index
const getWeeklyChallenge = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.floor(((now - start) / 86400000 + start.getDay()) / 7);
  return CHALLENGES[weekNum % CHALLENGES.length];
};

export const WeeklyChallenge = ({ onPress }) => {
  const { theme } = useTheme();
  const challenge = getWeeklyChallenge();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Weekly challenge: ${challenge.title}`}
    >
      <LinearGradient
        colors={[theme.accent.primary + 'DD', theme.accent.secondary + 'DD']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.badge}>
            <Target size={14} color={theme.text.inverse} />
            <Text style={[styles.badgeText, { color: theme.text.inverse }]}>Weekly Challenge</Text>
          </View>
        </View>
        <Text style={[styles.title, { color: theme.text.inverse }]}>{challenge.title}</Text>
        <Text style={[styles.description, { color: theme.text.inverse + 'CC' }]}>{challenge.description}</Text>
        <View style={styles.tipRow}>
          <Text style={[styles.tip, { color: theme.text.inverse + 'AA' }]}>💡 {challenge.tip}</Text>
          <ChevronRight size={18} color={theme.text.inverse + '80'} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.screenHorizontal,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fonts?.serif || 'Georgia',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tip: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
});
