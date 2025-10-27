import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MOCK_PIZZAS } from '../data/mockData';
import type { Pizza } from '../types';

export class InitializationService {
  /**
   * Vérifie si Firebase est disponible et configuré
   */
  static isFirebaseAvailable(): boolean {
    return db !== null && db !== undefined;
  }

  /**
   * Vérifie si la collection pizzas existe et contient des données
   */
  static async isPizzaCollectionEmpty(): Promise<boolean> {
    if (!this.isFirebaseAvailable()) {
      return true;
    }

    try {
      const pizzasRef = collection(db, 'pizzas');
      const snapshot = await getDocs(pizzasRef);
      return snapshot.empty;
    } catch (error) {
      // Si c'est une erreur de permissions, on considère que Firebase n'est pas accessible
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ Permissions Firestore insuffisantes - utilisation des données mock');
        return true; // On retourne true pour forcer l'utilisation des données mock
      }
      console.error('Erreur lors de la vérification de la collection pizzas:', error);
      return true;
    }
  }

  /**
   * Initialise Firebase avec les pizzas de base
   */
  static async initializePizzasInFirebase(): Promise<boolean> {
    if (!this.isFirebaseAvailable()) {
      console.warn('Firebase non disponible - impossible d\'initialiser les pizzas');
      return false;
    }

    try {
      const pizzasRef = collection(db, 'pizzas');
      
      console.log('🍕 Initialisation des pizzas dans Firebase...');
      
      for (const pizza of MOCK_PIZZAS) {
        await addDoc(pizzasRef, {
          ...pizza,
          active: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }

      console.log(`✅ ${MOCK_PIZZAS.length} pizzas ajoutées avec succès dans Firebase`);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des pizzas:', error);
      return false;
    }
  }

  /**
   * Initialise automatiquement l'application
   */
  static async autoInitialize(): Promise<{
    firebaseAvailable: boolean;
    pizzasInitialized: boolean;
    source: 'firebase' | 'mock';
  }> {
    const firebaseAvailable = this.isFirebaseAvailable();
    
    if (!firebaseAvailable) {
      console.warn('🔧 Mode développement: Firebase non configuré');
      return {
        firebaseAvailable: false,
        pizzasInitialized: false,
        source: 'firebase'
      };
    }

    try {
      const isEmpty = await this.isPizzaCollectionEmpty();
      
      if (isEmpty) {
        console.log('📦 Base de données vide détectée.');
        
        return {
          firebaseAvailable: true,
          pizzasInitialized: false,
          source: 'firebase'
        };
      } else {
        console.log('✅ Base de données Firebase déjà configurée');
        return {
          firebaseAvailable: true,
          pizzasInitialized: true,
          source: 'firebase'
        };
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'auto-initialisation:', error);
      return {
        firebaseAvailable: true,
        pizzasInitialized: false,
        source: 'firebase'
      };
    }
  }
}