import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  Pressable,
} from 'react-native';
import { X, Search, Check } from 'lucide-react-native';
import { colors, typography, spacing, getTeaTypeColor, getPlaceholderImage } from '../constants';
import { useTeas } from '../hooks';

export const TeaPickerModal = ({
  visible,
  onClose,
  onSelect,
  excludeIds = [],
  title = 'Select a Tea',
}) => {
  const { teas } = useTeas();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredTeas = useMemo(() => {
    let result = teas.filter(tea => !excludeIds.includes(tea.id));
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(tea =>
        tea.name.toLowerCase().includes(q) ||
        tea.brandName.toLowerCase().includes(q) ||
        tea.teaType.toLowerCase().includes(q)
      );
    }
    
    return result.slice(0, 50); // Limit for performance
  }, [teas, excludeIds, searchQuery]);

  const renderTeaItem = ({ item: tea }) => {
    const teaColor = getTeaTypeColor(tea.teaType);
    
    return (
      <TouchableOpacity
        style={styles.teaItem}
        onPress={() => {
          onSelect(tea);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.teaImageContainer}>
          <Image 
            source={tea.imageUrl ? { uri: tea.imageUrl } : getPlaceholderImage(tea.teaType)}
            style={styles.teaImage}
          />
        </View>
        <View style={styles.teaInfo}>
          <Text style={styles.teaName} numberOfLines={1}>{tea.name}</Text>
          <Text style={styles.teaBrand} numberOfLines={1}>{tea.brandName}</Text>
          <View style={styles.teaMeta}>
            <View style={[styles.typeBadge, { backgroundColor: teaColor.primary + '20' }]}>
              <Text style={[styles.typeText, { color: teaColor.primary }]}>
                {tea.teaType}
              </Text>
            </View>
            {tea.avgRating > 0 && (
              <Text style={styles.rating}>★ {tea.avgRating.toFixed(1)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color={colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search teas..."
              placeholderTextColor={colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tea List */}
        <FlatList
          data={filteredTeas}
          renderItem={renderTeaItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No teas found</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    ...typography.headingSmall,
    color: colors.text.primary,
  },
  searchContainer: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
  },
  listContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: 40,
  },
  teaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  teaImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  teaImage: {
    width: '100%',
    height: '100%',
  },
  teaInfo: {
    flex: 1,
  },
  teaName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  teaBrand: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  teaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    ...typography.caption,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  rating: {
    ...typography.caption,
    color: colors.rating.star,
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});

export default TeaPickerModal;
