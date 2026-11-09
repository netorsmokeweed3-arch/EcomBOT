// src/theme/ProfileContext.tsx
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { createMMKV } from 'react-native-mmkv';

// Створюємо екземпляр сховища через createMMKV
export const storage = createMMKV();

interface ProfileContextType {
  nickname: string;
  lastName: string;
  firstName: string;
  middleName: string;
  avatarUri: string | null;
  saveProfile: (data: { nickname: string; lastName: string; firstName: string; middleName: string; avatarUri?: string | null }) => void;
}

export const ProfileContext = createContext<ProfileContextType>({
  nickname: '',
  lastName: '',
  firstName: '',
  middleName: '',
  avatarUri: null,
  saveProfile: () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [nickname, setNickname] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // При завантаженні додатку миттєво зчитуємо дані з MMKV
  useEffect(() => {
    try {
      const storedNick = storage.getString('profile_nickname') || '';
      const storedLast = storage.getString('profile_lastname') || '';
      const storedFirst = storage.getString('profile_firstname') || '';
      const storedMiddle = storage.getString('profile_middlename') || '';
      const storedAvatar = storage.getString('profile_avatar') || null;

      setNickname(storedNick);
      setLastName(storedLast);
      setFirstName(storedFirst);
      setMiddleName(storedMiddle);
      setAvatarUri(storedAvatar);
    } catch (e) {
      console.error('[MMKV_READ_ERROR]', e);
    }
  }, []);

  const saveProfile = (data: { nickname: string; lastName: string; firstName: string; middleName: string; avatarUri?: string | null }) => {
    try {
      // Зберігаємо в стейт
      setNickname(data.nickname);
      setLastName(data.lastName);
      setFirstName(data.firstName);
      setMiddleName(data.middleName);

      // Записуємо напряму в MMKV сховище
      storage.set('profile_nickname', data.nickname);
      storage.set('profile_lastname', data.lastName);
      storage.set('profile_firstname', data.firstName);
      storage.set('profile_middlename', data.middleName);

      if (data.avatarUri !== undefined) {
        setAvatarUri(data.avatarUri);
        if (data.avatarUri) {
          storage.set('profile_avatar', data.avatarUri);
        } else {
          storage.remove('profile_avatar');
        }
      }
    } catch (e) {
      console.error('[MMKV_WRITE_ERROR]', e);
    }
  };

  return (
    <ProfileContext.Provider value={{ nickname, lastName, firstName, middleName, avatarUri, saveProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}