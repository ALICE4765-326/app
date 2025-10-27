import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface PizzeriaSettings {
  logo_url: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  delete_password: string;
  opening_hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
}

const defaultSettings: PizzeriaSettings = {
  logo_url: '',
  name: '',
  address: '123 Avenida da Liberdade, 1250-096 Lisboa, Portugal',
  phone: '+351 21 123 45 67',
  email: 'contacto@pizza-delice.pt',
  delete_password: 'delete123',
  opening_hours: {
    monday: '11h30 - 22h30',
    tuesday: '11h30 - 22h30',
    wednesday: '11h30 - 22h30',
    thursday: '11h30 - 22h30',
    friday: '11h30 - 23h30',
    saturday: '11h30 - 23h30',
    sunday: '12h00 - 22h00'
  }
};

const SETTINGS_DOC_ID = 'global-settings';

export function usePizzeriaSettings() {
  const [settings, setSettings] = useState<PizzeriaSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      console.warn('Firebase non disponible');
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);

    const unsubscribe = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as PizzeriaSettings;
          setSettings({ ...defaultSettings, ...data });
          console.log('✅ Paramètres chargés depuis Firestore:', data);
        } else {
          setSettings(defaultSettings);
          setDoc(settingsRef, defaultSettings)
            .then(() => console.log('✅ Paramètres par défaut créés dans Firestore'))
            .catch((err) => console.error('Erreur création paramètres:', err));
        }
        setLoading(false);
      },
      (error) => {
        console.error('Erreur chargement paramètres:', error);
        setSettings(defaultSettings);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<PizzeriaSettings>) => {
    if (!db) {
      console.error('Firebase non disponible');
      return false;
    }

    try {
      const updatedSettings = { ...settings, ...newSettings };
      const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);

      await setDoc(settingsRef, updatedSettings);

      console.log('✅ Paramètres sauvegardés dans Firestore');
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      return false;
    }
  }, [settings]);

  return {
    settings,
    loading,
    updateSettings
  };
}