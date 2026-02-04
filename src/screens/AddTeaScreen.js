import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { typography, spacing } from '../constants';
import { Button } from '../components';
import { supabase } from '../lib/supabase';
import { haptics } from '../utils';

const TEA_TYPES = [
  { value: 'black', label: 'Black', color: '#8B4513' },
  { value: 'green', label: 'Green', color: '#228B22' },
  { value: 'oolong', label: 'Oolong', color: '#DAA520' },
  { value: 'white', label: 'White', color: '#F5F5DC' },
  { value: 'puerh', label: 'Pu-erh', color: '#4A0E0E' },
  { value: 'herbal', label: 'Herbal', color: '#9370DB' },
];

export default function AddTeaScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, isDevMode } = useAuth();
  const styles = createStyles(theme);

  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [teaType, setTeaType] = useState('');
  const [description, setDescription] = useState('');
  const [purchaseLocation, setPurchaseLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    haptics.light();
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to add tea photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    haptics.light();
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take tea photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const uploadImage = async () => {
    if (!image) return null;

    const ext = image.uri.split('.').pop();
    const fileName = `${user?.id || 'dev'}-${Date.now()}.${ext}`;
    const filePath = `custom-teas/${fileName}`;

    // Read the file
    const response = await fetch(image.uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('tea-photos')
      .upload(filePath, blob, {
        contentType: `image/${ext}`,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('tea-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a tea name');
      return;
    }
    if (!teaType) {
      Alert.alert('Required', 'Please select a tea type');
      return;
    }

    haptics.medium();
    setLoading(true);

    try {
      let imageUrl = null;
      if (image && !isDevMode) {
        imageUrl = await uploadImage();
      }

      if (isDevMode) {
        // Dev mode: just simulate success
        haptics.success();
        Alert.alert('Success', 'Tea added to your collection!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        return;
      }

      const { error } = await supabase.from('teas').insert({
        name: name.trim(),
        brand_name: brandName.trim() || 'Personal Collection',
        tea_type: teaType,
        description: description.trim() || null,
        image_url: imageUrl,
        is_custom: true,
        created_by: user.id,
        purchase_location: purchaseLocation.trim() || null,
        user_notes: notes.trim() || null,
      });

      if (error) throw error;

      haptics.success();
      Alert.alert('Success', 'Tea added to your collection!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error adding tea:', error);
      haptics.error();
      Alert.alert('Error', 'Failed to add tea. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Picker */}
          <View style={styles.imageSection}>
            {image ? (
              <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.image} />
                <View style={styles.changeImageOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.changeImageText}>Change</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.imagePlaceholder}>
                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                  <Ionicons name="images-outline" size={28} color={theme.text.tertiary} />
                  <Text style={styles.imageButtonText}>Choose Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={28} color={theme.text.tertiary} />
                  <Text style={styles.imageButtonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Tea Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tea Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Dragon Well Spring 2024"
              placeholderTextColor={theme.text.tertiary}
            />
          </View>

          {/* Brand Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Brand / Vendor</Text>
            <TextInput
              style={styles.input}
              value={brandName}
              onChangeText={setBrandName}
              placeholder="e.g., Yunnan Sourcing"
              placeholderTextColor={theme.text.tertiary}
            />
          </View>

          {/* Tea Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tea Type *</Text>
            <View style={styles.typeGrid}>
              {TEA_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    teaType === type.value && styles.typeButtonActive,
                    { borderColor: type.color }
                  ]}
                  onPress={() => {
                    haptics.selection();
                    setTeaType(type.value);
                  }}
                >
                  <View style={[styles.typeColor, { backgroundColor: type.color }]} />
                  <Text style={[
                    styles.typeLabel,
                    teaType === type.value && styles.typeLabelActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tasting notes, origin, etc."
              placeholderTextColor={theme.text.tertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Purchase Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Where did you get it?</Text>
            <TextInput
              style={styles.input}
              value={purchaseLocation}
              onChangeText={setPurchaseLocation}
              placeholder="e.g., Local tea shop, Online"
              placeholderTextColor={theme.text.tertiary}
            />
          </View>

          {/* Personal Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Personal Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any notes for yourself..."
              placeholderTextColor={theme.text.tertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={loading ? "Adding..." : "Add to Collection"}
              onPress={handleSave}
              disabled={loading}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  imageSection: {
    marginBottom: spacing.xl,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  imagePlaceholder: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  imageButton: {
    flex: 1,
    height: 120,
    backgroundColor: theme.background.secondary,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.border.light,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  imageButtonText: {
    fontSize: 14,
    color: theme.text.tertiary,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: theme.text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: theme.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    color: theme.text.primary,
    borderWidth: 1,
    borderColor: theme.border.light,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: theme.background.secondary,
    gap: spacing.xs,
  },
  typeButtonActive: {
    backgroundColor: theme.background.tertiary,
  },
  typeColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  typeLabel: {
    fontSize: 14,
    color: theme.text.secondary,
  },
  typeLabelActive: {
    color: theme.text.primary,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  saveButton: {
    width: '100%',
  },
});
