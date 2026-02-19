import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Sparkles, TreeDeciduous, RotateCcw } from 'lucide-react-native';
import { typography, spacing, fonts } from '../constants';
import { TeaCard } from '../components';
import { useTheme, useAuth } from '../context';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';

const { width } = Dimensions.get('window');
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const GREETING = "I'm Teabeard. Former tactical AI, current tea sommelier. The mission changed, but the precision didn't. Tell me what you're looking for — mood, flavor, caffeine requirements — and I'll narrow down 7,000+ teas to the ones that matter.";

const CONVERSATION_STARTERS = [
  "Something cozy for a rainy evening",
  "I need energy but not coffee",
  "I'm new to tea, what's the mission?",
  "Help me wind down for sleep",
  "Something bold that doesn't mess around",
  "Surprise me, robot",
];

// Normalize Supabase snake_case rows to camelCase app format
const formatTea = (tea) => ({
  ...tea,
  brandName: tea.brand_name ?? tea.brandName,
  teaType: tea.tea_type ?? tea.teaType,
  imageUrl: tea.image_url ?? tea.imageUrl,
  avgRating: tea.avg_rating ?? tea.avgRating,
  ratingCount: tea.rating_count ?? tea.ratingCount,
  companyId: tea.company_id ?? tea.companyId,
  flavorNotes: tea.flavor_notes ?? tea.flavorNotes ?? [],
  steepTempF: tea.steep_temp_f ?? tea.steepTempF,
  steepTimeMin: tea.steep_time_min ?? tea.steepTimeMin,
  createdAt: tea.created_at ?? tea.createdAt,
});

export const TeaFinderScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [messages, setMessages] = useState([
    { id: '0', role: 'assistant', content: GREETING, recommendations: [] },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    setInput('');
    Keyboard.dismiss();

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      recommendations: [],
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    trackEvent('tea_sommelier_message', { message_length: messageText.length });

    try {
      // Build conversation history for API (exclude greeting, limit to last 10)
      // Include recommendation names in assistant messages so model knows what was already suggested
      const apiMessages = [...messages.filter(m => m.id !== '0'), userMsg]
        .slice(-10)
        .map(m => {
          let content = m.content;
          if (m.role === 'assistant' && m.recommendations?.length > 0) {
            const recNames = m.recommendations.map(r => r.tea?.name || r.name).filter(Boolean);
            content += `\n[Previously recommended: ${recNames.join(', ')}]`;
          }
          return { role: m.role, content };
        });

      const response = await fetch(`${SUPABASE_URL}/functions/v1/tea-sommelier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          messages: apiMessages,
          user_preferences: profile ? {
            preferred_tea_types: profile.preferred_tea_types,
            caffeine_preference: profile.caffeine_preference,
            preferred_flavors: profile.preferred_flavors,
          } : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || "I'd love to help — could you tell me a bit more about what you're looking for?",
        recommendations: (data.recommendations || []).map(rec => ({
          ...rec,
          tea: rec.tea ? formatTea(rec.tea) : null,
        })),
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (data.recommendations?.length > 0) {
        trackEvent('tea_sommelier_recommendations', {
          count: data.recommendations.length,
          teas: data.recommendations.map(r => r.name),
        });
      }
    } catch (err) {
      console.error('Sommelier error:', err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Oh, I'm so sorry — I got a little distracted there. Could you say that again? I want to make sure I find you something wonderful.",
        recommendations: [],
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, profile]);

  const handleStartOver = () => {
    setMessages([
      { id: Date.now().toString(), role: 'assistant', content: GREETING, recommendations: [] },
    ]);
    setInput('');
  };

  const renderRecommendationCard = (rec, index) => {
    if (!rec.tea) return null;
    return (
      <TouchableOpacity
        key={rec.tea.id || index}
        style={[styles.recCard, { backgroundColor: theme.background.secondary, borderColor: theme.border }]}
        onPress={() => navigation.navigate('TeaDetail', { tea: rec.tea })}
        activeOpacity={0.7}
      >
        <View style={styles.recHeader}>
          <Text style={[styles.recName, { color: theme.text.primary }]} numberOfLines={2}>
            {rec.tea.name}
          </Text>
          <Text style={[styles.recBrand, { color: theme.text.secondary }]}>
            {rec.tea.brandName || rec.tea.brand_name}
          </Text>
        </View>
        {rec.reason ? (
          <Text style={[styles.recReason, { color: theme.text.secondary }]} numberOfLines={3}>
            "{rec.reason}"
          </Text>
        ) : null}
        <View style={styles.recFooter}>
          <View style={[styles.recTypeBadge, { backgroundColor: `${theme.accent?.primary || '#4A90A4'}20` }]}>
            <Text style={[styles.recTypeText, { color: theme.accent?.primary || '#4A90A4' }]}>
              {rec.tea.teaType || rec.tea.tea_type}
            </Text>
          </View>
          <Text style={[styles.recTap, { color: theme.accent?.primary || '#4A90A4' }]}>
            View →
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: `${theme.accent?.primary || '#4A90A4'}20` }]}>
            <TreeDeciduous size={16} color={theme.accent?.primary || '#4A90A4'} strokeWidth={1.5} />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, { backgroundColor: theme.accent?.primary || '#4A90A4' }]
            : [styles.assistantBubble, { backgroundColor: theme.background.secondary }],
        ]}>
          <Text style={[
            styles.messageText,
            { color: isUser ? '#fff' : theme.text.primary },
          ]}>
            {item.content}
          </Text>
        </View>
        {item.recommendations?.length > 0 && (
          <View style={styles.recommendationsContainer}>
            {item.recommendations.map((rec, idx) => renderRecommendationCard(rec, idx))}
          </View>
        )}
      </View>
    );
  };

  const showStarters = messages.length === 1 && !loading;

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerAvatar, { backgroundColor: `${theme.accent?.primary || '#4A90A4'}20` }]}>
              <TreeDeciduous size={20} color={theme.accent?.primary || '#4A90A4'} strokeWidth={1.5} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Teabeard</Text>
              <Text style={[styles.headerSubtitle, { color: theme.text.secondary }]}>Humor: 75% · Honesty: 90%</Text>
            </View>
          </View>
          {messages.length > 2 && (
            <TouchableOpacity onPress={handleStartOver} style={styles.resetButton}>
              <RotateCcw size={18} color={theme.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={() => (
            <>
              {/* Conversation starters */}
              {showStarters && (
                <View style={styles.startersContainer}>
                  <Text style={[styles.startersLabel, { color: theme.text.tertiary }]}>Try saying:</Text>
                  <View style={styles.starters}>
                    {CONVERSATION_STARTERS.map((starter) => (
                      <TouchableOpacity
                        key={starter}
                        style={[styles.starterChip, { backgroundColor: theme.background.secondary, borderColor: theme.border }]}
                        onPress={() => sendMessage(starter)}
                      >
                        <Text style={[styles.starterText, { color: theme.text.primary }]}>{starter}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {/* Loading indicator */}
              {loading && (
                <View style={[styles.messageRow]}>
                  <View style={[styles.avatar, { backgroundColor: `${theme.accent?.primary || '#4A90A4'}20` }]}>
                    <TreeDeciduous size={16} color={theme.accent?.primary || '#4A90A4'} strokeWidth={1.5} />
                  </View>
                  <View style={[styles.typingBubble, { backgroundColor: theme.background.secondary }]}>
                    <View style={styles.typingDots}>
                      <TypingDot delay={0} color={theme.text.tertiary} />
                      <TypingDot delay={200} color={theme.text.tertiary} />
                      <TypingDot delay={400} color={theme.text.tertiary} />
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        />

        {/* Input */}
        <View style={[styles.inputContainer, { borderTopColor: theme.border }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
            placeholder="Tell me what you're looking for..."
            placeholderTextColor={theme.text.tertiary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            multiline
            maxLength={500}
            blurOnSubmit
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: input.trim() ? (theme.accent?.primary || '#4A90A4') : theme.background.secondary },
            ]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Send size={18} color={input.trim() ? '#fff' : theme.text.tertiary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Animated typing dot
const TypingDot = ({ delay, color }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: color,
        opacity,
        marginHorizontal: 2,
      }}
    />
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 17,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  resetButton: {
    padding: 8,
  },
  messagesList: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  messageRow: {
    marginBottom: spacing.md,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  messageRowUser: {
    alignItems: 'flex-end',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: width * 0.8,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  userBubble: {
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts?.body || undefined,
  },
  typingBubble: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationsContainer: {
    marginTop: 8,
    gap: 8,
    width: width - spacing.screenHorizontal * 2,
  },
  recCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  recHeader: {
    marginBottom: 6,
  },
  recName: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  recBrand: {
    fontSize: 13,
    marginTop: 2,
  },
  recReason: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  recFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recTypeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  recTap: {
    fontSize: 13,
    fontWeight: '600',
  },
  startersContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  startersLabel: {
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  starters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  starterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  starterText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TeaFinderScreen;
