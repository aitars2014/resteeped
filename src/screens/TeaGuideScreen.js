import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp, Coffee, Leaf, TreeDeciduous, Sprout, Mountain, Sun, Flower2, Flame, Clock, Droplets, RotateCcw } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';

const { width } = Dimensions.get('window');

const TEA_GUIDE_DATA = [
  {
    type: 'black',
    name: 'Black Tea',
    emoji: '☕',
    tagline: 'Bold, malty, fully oxidized',
    description:
      'Black tea is the most processed of the true teas — leaves are fully oxidized, turning dark and developing rich, robust flavors. Think breakfast teas, Assam, Darjeeling, and Ceylon.',
    flavorNotes: ['Malty', 'Bold', 'Earthy', 'Occasionally fruity'],
    origin: 'China, India, Sri Lanka',
    temp: '212°F / 100°C',
    steepTime: '3–5 min',
    infusions: '1–2x',
    caffeineLevel: 3,
    beginnerPick: 'Assam or English Breakfast — approachable, pairs great with milk',
    funFact: 'In China, black tea is called "red tea" because of the color of the brewed liquid.',
  },
  {
    type: 'green',
    name: 'Green Tea',
    emoji: '🍵',
    tagline: 'Fresh, grassy, minimal oxidation',
    description:
      'Green tea skips oxidation — leaves are quickly heated after picking to preserve their green color and fresh, vegetal character. Japanese and Chinese styles taste very different from each other.',
    flavorNotes: ['Grassy', 'Vegetal', 'Nutty', 'Oceanic (Japanese)'],
    origin: 'China, Japan, Korea',
    temp: '160–180°F / 70–82°C',
    steepTime: '1–3 min',
    infusions: '3–4x',
    caffeineLevel: 2,
    beginnerPick: 'Dragonwell (Longjing) for Chinese style, or Sencha for Japanese',
    funFact: 'Never use boiling water — it scorches green tea and makes it bitter.',
  },
  {
    type: 'oolong',
    name: 'Oolong Tea',
    emoji: '🌿',
    tagline: 'Complex, layered, partially oxidized',
    description:
      'Oolong sits between green and black tea with partial oxidation (15–85%). Light oolongs taste floral and creamy; dark roasted oolongs taste rich and toasty. Each steep reveals new flavors.',
    flavorNotes: ['Floral', 'Creamy', 'Toasty', 'Fruity', 'Honeyed'],
    origin: 'Taiwan, Fujian (China)',
    temp: '185–205°F / 85–96°C',
    steepTime: '2–4 min (or 20–40 sec gongfu)',
    infusions: '5–8x',
    caffeineLevel: 2,
    beginnerPick: "Dong Ding or Four Seasons Oolong — forgiving, naturally sweet",
    funFact: 'Oolong is the go-to tea for gongfu brewing — multiple short steeps that evolve dramatically.',
  },
  {
    type: 'white',
    name: 'White Tea',
    emoji: '🌸',
    tagline: 'Delicate, subtle, barely processed',
    description:
      'White tea is the least processed tea — just young buds and leaves, dried naturally. The result is extraordinarily delicate with floral and honeyed notes. Easy to ruin with too-hot water.',
    flavorNotes: ['Floral', 'Honey', 'Melon', 'Cucumber', 'Hay'],
    origin: 'Fujian, China',
    temp: '160–180°F / 70–82°C',
    steepTime: '2–5 min',
    infusions: '3–5x',
    caffeineLevel: 1,
    beginnerPick: 'Bai Mu Dan (White Peony) — more character than Silver Needle, easier to source',
    funFact: "Silver Needle (Baihao Yinzhen) is made only from unopened buds — often the world's most expensive tea by weight.",
  },
  {
    type: 'puerh',
    name: "Pu'erh Tea",
    emoji: '🍂',
    tagline: 'Earthy, aged, fermented depth',
    description:
      "Pu'erh is fermented and aged — sometimes for decades. Sheng (raw) pu'erh ages slowly and gets better over time like wine. Shou (ripe) is artificially aged and ready to drink now. Both taste nothing like anything else.",
    flavorNotes: ['Earthy', 'Woody', 'Leather', 'Mushroom', 'Compost (good!)'],
    origin: 'Yunnan, China',
    temp: '212°F / 100°C',
    steepTime: '3–5 min (or 10–30 sec gongfu)',
    infusions: '8–15x',
    caffeineLevel: 2,
    beginnerPick: "Shou (ripe) pu'erh — milder, more approachable than aged raw cakes",
    funFact: "Pu'erh cakes are considered investment assets in China — some sell for thousands of dollars.",
  },
  {
    type: 'yellow',
    name: 'Yellow Tea',
    emoji: '🌞',
    tagline: 'Rare, mellow, lightly oxidized',
    description:
      'Yellow tea is the rarest of the six types — only a handful of regions still make it. The unique "yellowing" process (men huan) mellow out the grassy notes of green tea for a smoother, sweeter cup.',
    flavorNotes: ['Mellow', 'Sweet', 'Lightly floral', 'Clean'],
    origin: 'Hunan, Sichuan, Anhui (China)',
    temp: '160–175°F / 70–80°C',
    steepTime: '2–3 min',
    infusions: '3x',
    caffeineLevel: 2,
    beginnerPick: "Jun Shan Yin Zhen — the most famous yellow tea, if you can find it",
    funFact: 'Yellow tea nearly went extinct — the processing knowledge was kept secret and almost lost entirely.',
  },
  {
    type: 'herbal',
    name: 'Herbal Tea',
    emoji: '🌺',
    tagline: 'Caffeine-free, botanical, endless variety',
    description:
      'Technically not "tea" — herbal teas (tisanes) contain no Camellia sinensis leaves. Instead they use herbs, flowers, fruits, and roots. Chamomile, rooibos, hibiscus, peppermint — completely different from each other.',
    flavorNotes: ['Varies wildly', 'Floral', 'Fruity', 'Spicy', 'Earthy'],
    origin: 'Worldwide',
    temp: '205–212°F / 96–100°C',
    steepTime: '5–10 min',
    infusions: '1–2x',
    caffeineLevel: 0,
    beginnerPick: "Rooibos — naturally sweet, caffeine-free, delicious with milk",
    funFact: "Rooibos comes exclusively from a small region of South Africa's Western Cape — nowhere else in the world.",
  },
];

const CaffeineBar = ({ level }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.caffeineRow}>
      <Text style={[styles.brewLabel, { color: theme.text.secondary }]}>Caffeine</Text>
      <View style={styles.caffeineDots}>
        {[1, 2, 3].map((dot) => (
          <View
            key={dot}
            style={[
              styles.caffeineDot,
              {
                backgroundColor:
                  dot <= level
                    ? theme.text.primary
                    : theme.background.secondary,
                borderColor: theme.border.light,
              },
            ]}
          />
        ))}
        {level === 0 && (
          <Text style={[styles.noCaffeine, { color: theme.text.secondary }]}>None</Text>
        )}
      </View>
    </View>
  );
};

const TeaTypeCard = ({ tea, isExpanded, onToggle }) => {
  const { theme } = useTheme();
  const typeColors = theme.teaType[tea.type] || theme.teaType.black;

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: theme.background.primary,
          shadowColor: theme.shadow.card,
          borderColor: theme.border.light,
        },
      ]}
    >
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={[styles.emojiContainer, { backgroundColor: typeColors.primary + '22' }]}>
          <Text style={styles.emoji}>{tea.emoji}</Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={[styles.teaName, { color: theme.text.primary }]}>{tea.name}</Text>
          <Text style={[styles.tagline, { color: theme.text.secondary }]}>{tea.tagline}</Text>
        </View>
        {isExpanded ? (
          <ChevronUp size={18} color={theme.text.tertiary} />
        ) : (
          <ChevronDown size={18} color={theme.text.tertiary} />
        )}
      </View>

      {/* Expanded content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Description */}
          <Text style={[styles.description, { color: theme.text.primary }]}>{tea.description}</Text>

          {/* Flavor notes */}
          <View style={styles.flavorRow}>
            {tea.flavorNotes.map((note) => (
              <View
                key={note}
                style={[styles.flavorPill, { backgroundColor: typeColors.primary + '1A' }]}
              >
                <Text style={[styles.flavorText, { color: typeColors.primary }]}>{note}</Text>
              </View>
            ))}
          </View>

          {/* Origin */}
          <Text style={[styles.origin, { color: theme.text.secondary }]}>
            📍 {tea.origin}
          </Text>

          {/* Brew basics */}
          <View style={[styles.brewBox, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
            <Text style={[styles.brewTitle, { color: theme.text.secondary }]}>BREWING BASICS</Text>
            <View style={styles.brewGrid}>
              <View style={styles.brewItem}>
                <Flame size={13} color={theme.text.tertiary} style={styles.brewIcon} />
                <Text style={[styles.brewLabel, { color: theme.text.secondary }]}>Temp</Text>
                <Text style={[styles.brewValue, { color: theme.text.primary }]}>{tea.temp}</Text>
              </View>
              <View style={styles.brewItem}>
                <Clock size={13} color={theme.text.tertiary} style={styles.brewIcon} />
                <Text style={[styles.brewLabel, { color: theme.text.secondary }]}>Steep</Text>
                <Text style={[styles.brewValue, { color: theme.text.primary }]}>{tea.steepTime}</Text>
              </View>
              <View style={styles.brewItem}>
                <RotateCcw size={13} color={theme.text.tertiary} style={styles.brewIcon} />
                <Text style={[styles.brewLabel, { color: theme.text.secondary }]}>Re-steeps</Text>
                <Text style={[styles.brewValue, { color: theme.text.primary }]}>{tea.infusions}</Text>
              </View>
            </View>
            {tea.caffeineLevel !== undefined && <CaffeineBar level={tea.caffeineLevel} />}
          </View>

          {/* Beginner pick */}
          <View style={[styles.beginnerBox, { backgroundColor: typeColors.primary + '0F', borderColor: typeColors.primary + '33' }]}>
            <Text style={[styles.beginnerLabel, { color: typeColors.primary }]}>★ GOOD STARTING POINT</Text>
            <Text style={[styles.beginnerText, { color: theme.text.primary }]}>{tea.beginnerPick}</Text>
          </View>

          {/* Fun fact */}
          <Text style={[styles.funFact, { color: theme.text.secondary }]}>
            💡 {tea.funFact}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const TeaGuideScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [expandedType, setExpandedType] = useState(null);

  const handleToggle = (type) => {
    setExpandedType((prev) => (prev === type ? null : type));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Tea Guide</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <Text style={[styles.intro, { color: theme.text.secondary }]}>
          All "true" teas come from the same plant — Camellia sinensis. The type is determined by how the leaves are processed. Tap any card to learn more.
        </Text>

        {/* Tea type cards */}
        {TEA_GUIDE_DATA.map((tea) => (
          <TeaTypeCard
            key={tea.type}
            tea={tea}
            isExpanded={expandedType === tea.type}
            onToggle={() => handleToggle(tea.type)}
          />
        ))}

        {/* Footer note */}
        <Text style={[styles.footer, { color: theme.text.tertiary }]}>
          Herbal teas aren't technically "tea" — they're tisanes made from plants other than Camellia sinensis. But they belong in any tea lover's rotation.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 36,
  },
  headerTitle: {
    ...typography.title3,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 12,
  },
  intro: {
    ...typography.body,
    marginBottom: 8,
    lineHeight: 22,
  },
  card: {
    borderRadius: spacing.cardBorderRadius,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: {
    fontSize: 22,
  },
  cardTitleBlock: {
    flex: 1,
  },
  teaName: {
    ...typography.headline,
    fontWeight: '600',
  },
  tagline: {
    ...typography.caption,
    marginTop: 2,
  },
  expandedContent: {
    marginTop: 16,
    gap: 12,
  },
  description: {
    ...typography.body,
    lineHeight: 22,
  },
  flavorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  flavorPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  flavorText: {
    ...typography.caption,
    fontWeight: '500',
  },
  origin: {
    ...typography.caption,
  },
  brewBox: {
    borderRadius: 10,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  brewTitle: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  brewGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  brewItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  brewIcon: {
    marginBottom: 2,
  },
  brewLabel: {
    ...typography.caption,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  brewValue: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
  },
  caffeineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  caffeineDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  caffeineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  noCaffeine: {
    ...typography.caption,
    fontSize: 11,
    marginLeft: 4,
  },
  beginnerBox: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  beginnerLabel: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
    fontSize: 10,
  },
  beginnerText: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 19,
  },
  funFact: {
    ...typography.caption,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  footer: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
