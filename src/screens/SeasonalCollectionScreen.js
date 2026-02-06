import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TeaCard } from '../components';
import { spacing, typography } from '../constants';
import { useTheme } from '../context';

export const SeasonalCollectionScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { teas = [], title, description, colors = ['#4A90A4', '#2C5F7C'] } = route.params || {};

  const renderHeader = () => (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.count}>{teas.length} curated teas</Text>
      </View>
    </LinearGradient>
  );

  const renderTea = ({ item }) => (
    <View style={styles.teaCardWrapper}>
      <TeaCard
        tea={item}
        onPress={() => navigation.navigate('TeaDetail', { tea: item })}
        variant="full"
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]} edges={['bottom']}>
      <FlatList
        data={teas}
        renderItem={renderTea}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: spacing.screenHorizontal,
    zIndex: 1,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    ...typography.headingLarge,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  count: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
  },
  list: {
    paddingBottom: spacing.xl,
  },
  row: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.cardGap,
    marginBottom: spacing.cardGap,
  },
  teaCardWrapper: {
    flex: 1,
    maxWidth: '50%',
  },
});

export default SeasonalCollectionScreen;
