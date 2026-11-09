// src/screens/SettingsScreen.tsx
import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar, TextInput, Switch, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext, THEMES } from '../theme/ThemeContext';
import { ProfileContext } from '../theme/ProfileContext';
import { GlassCard } from '../components/GlassCard';
import { AppScreen } from '../components/AppScreen';

export default function SettingsScreen() {
  const { theme, setThemeMode } = useContext(ThemeContext);
  const { nickname: globalNick, lastName: globalLast, firstName: globalFirst, middleName: globalMiddle, avatarUri: globalAvatar, saveProfile } = useContext(ProfileContext);

  const [nickname, setNickname] = useState(globalNick);
  const [lastName, setLastName] = useState(globalLast);
  const [firstName, setFirstName] = useState(globalFirst);
  const [middleName, setMiddleName] = useState(globalMiddle);
  const [avatarUri, setAvatarUri] = useState<string | null>(globalAvatar);
  
  const [isProfileSaved, setIsProfileSaved] = useState(Boolean(globalNick || globalFirst || globalAvatar));
  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    setNickname(globalNick);
    setLastName(globalLast);
    setFirstName(globalFirst);
    setMiddleName(globalMiddle);
    setAvatarUri(globalAvatar);
    if (globalNick || globalFirst || globalAvatar) {
      setIsProfileSaved(true);
    }
  }, [globalNick, globalLast, globalFirst, globalMiddle, globalAvatar]);

  // Функція вибору фото з галереї телефона
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Потрібен дозвіл', 'Будь ласка, надайте доступ до галереї, щоб встановити фото.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        const newUri = result.assets[0].uri;
        setAvatarUri(newUri);
        saveProfile({ nickname, lastName, firstName, middleName, avatarUri: newUri });
      }
    } catch (e) {
      console.error('[IMAGE_PICKER_ERROR]', e);
    }
  };

  const handleSaveProfile = () => {
    if (!nickname.trim() && (!lastName.trim() || !firstName.trim()) && !avatarUri) {
      Alert.alert('Помилка', "Будь ласка, додайте фото, нікнейм або Прізвище та Ім'я!");
      return;
    }
    saveProfile({ nickname, lastName, firstName, middleName, avatarUri });
    setIsProfileSaved(true);
    Alert.alert('Успіх', 'Дані профілю успішно збережено!');
  };

  // Визначення того, що показувати всередині аватарки, якщо немає фото
  const activeLetter = nickname.trim() ? nickname.trim().charAt(0).toUpperCase() : firstName.trim() ? firstName.trim().charAt(0).toUpperCase() : '';
  const displayName = nickname.trim() ? `@${nickname.trim()}` : `${lastName} ${firstName}`.trim() || 'Користувач SaaS';

  return (
    <AppScreen>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>Налаштування системи</Text>
          <Text style={[styles.topBarSub, { color: theme.textSecondary }]}>Профіль, теми та фонові сповіщення</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Блок Профілю з центральною круглою аватаркою */}
        <GlassCard style={styles.glassCardWrapper}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Профіль користувача</Text>
          
          {/* Центрований круглий аватар */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              style={[styles.avatarCircle, { backgroundColor: '#2c2c2e', borderColor: theme.primary + '40' }]} 
              onPress={handlePickImage}
              activeOpacity={0.8}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : activeLetter ? (
                <Text style={[styles.avatarLetter, { color: theme.primary }]}>{activeLetter}</Text>
              ) : (
                <Ionicons name="add" size={28} color="#8e8e93" />
              )}
            </TouchableOpacity>
            <Text style={[styles.avatarHint, { color: theme.textSecondary }]}>Натисніть, щоб змінити фото</Text>
          </View>

          {!isProfileSaved ? (
            <>
              <Text style={[styles.cardSub, { color: theme.textSecondary, textAlign: 'center' }]}>
                Введіть ваш нікнейм або Прізвище та Ім'я для ідентифікації в системі.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Нікнейм</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.08)', color: theme.textPrimary }]}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="Наприклад: netor"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />

                <Text style={[styles.sectionDividerText, { color: theme.textSecondary, textAlign: 'center', marginVertical: 12 }]}>— АБО ПІБ —</Text>

                <View style={styles.rowInputs}>
                  <TextInput
                    style={[styles.input, { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.08)', color: theme.textPrimary }]}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Прізвище"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.08)', color: theme.textPrimary }]}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Ім'я"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>

                <TextInput
                  style={[styles.input, { marginTop: 10, backgroundColor: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.08)', color: theme.textPrimary }]}
                  value={middleName}
                  onChangeText={setMiddleName}
                  placeholder="По батькові (необов'язково)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />

                <TouchableOpacity 
                  style={[styles.saveBtn, { backgroundColor: theme.primary, marginTop: 18 }]}
                  onPress={handleSaveProfile}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnText}>Зберегти профіль</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.savedProfileBox}>
              <Text style={[styles.cardSub, { color: theme.textSecondary, marginBottom: 12, textAlign: 'center' }]}>
                Ваші збережені дані:
              </Text>
              
              <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Ім'я / Нікнейм:</Text><Text style={[styles.infoVal, { color: theme.textPrimary }]}>{displayName}</Text></View>
              {lastName ? <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: theme.textSecondary }]}>ПІБ:</Text><Text style={[styles.infoVal, { color: theme.textPrimary }]}>{lastName} {firstName} {middleName}</Text></View> : null}

              <TouchableOpacity 
                style={[styles.editBtn, { borderColor: theme.primary, marginTop: 16 }]}
                onPress={() => setIsProfileSaved(false)}
                activeOpacity={0.85}
              >
                <Text style={[styles.editBtnText, { color: theme.primary }]}>Редагувати інформацію</Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>

        {/* Блок вибору теми */}
        <GlassCard style={styles.glassCardWrapper}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Преміальна Тема Оформлення</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
            Обери свій візуальний стиль. Шапка екрана та акценти почнуть плавно переливатися.
          </Text>

          <View style={styles.themesGrid}>
            {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((mode) => {
              const item = THEMES[mode];
              const isActive = theme.mode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeButton,
                    {
                      backgroundColor: 'rgba(0,0,0,0.25)',
                      borderColor: isActive ? item.primary : 'rgba(255,255,255,0.08)',
                    },
                  ]}
                  onPress={() => setThemeMode(mode)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.colorDot, { backgroundColor: item.primary }]} />
                  <Text style={[styles.themeBtnText, { color: isActive ? theme.textPrimary : theme.textSecondary }]}>
                    {item.name}
                  </Text>
                  {isActive && <Text style={[styles.activeMark, { color: item.primary }]}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Блок сповіщень */}
        <GlassCard style={styles.glassCardWrapper}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Автономні Сповіщення</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
            Push-повідомлення для миттєвого контролю замовлень та SOS-режиму підтримки.
          </Text>
          
          <View style={styles.rowBetween}>
            <Text style={[styles.rowText, { color: theme.textPrimary }]}>Увімкнути Push-повідомлення</Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.primary }}
              thumbColor="#fff"
            />
          </View>
        </GlassCard>

        <View style={styles.footerInfo}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Omnichannel SaaS-CRM Engine v2.5</Text>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Dark Glassmorphism Edition • 2026</Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, zIndex: 10 },
  topBarTitle: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  topBarSub: { fontSize: 11 },
  scrollContent: { padding: 12, paddingBottom: 90, zIndex: 1 },
  glassCardWrapper: { marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardSub: { fontSize: 12, marginBottom: 16, lineHeight: 18 },
  avatarContainer: { alignItems: 'center', marginVertical: 14 },
  avatarCircle: { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center', borderWidth: 2, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarLetter: { fontSize: 32, fontWeight: '800' },
  avatarHint: { fontSize: 11, marginTop: 6, fontWeight: '500' },
  inputGroup: { marginTop: 4 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  rowInputs: { flexDirection: 'row', gap: 8 },
  sectionDividerText: { fontSize: 11, fontWeight: '700', opacity: 0.6 },
  saveBtn: { justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
  saveBtnText: { color: '#070907', fontWeight: '800', fontSize: 14 },
  savedProfileBox: { marginTop: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  infoLabel: { fontSize: 13, fontWeight: '500' },
  infoVal: { fontSize: 13, fontWeight: '700' },
  editBtn: { borderWidth: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
  editBtnText: { fontWeight: '800', fontSize: 14 },
  themesGrid: { gap: 10 },
  themeButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  colorDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  themeBtnText: { flex: 1, fontSize: 14, fontWeight: '600' },
  activeMark: { fontSize: 16, fontWeight: '900' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowText: { fontSize: 13, fontWeight: '600' },
  footerInfo: { alignItems: 'center', marginTop: 10, marginBottom: 30 },
  footerText: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
});