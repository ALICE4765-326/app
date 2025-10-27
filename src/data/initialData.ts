import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import type { Pizza, User } from '../types';

// Fonction pour ajouter les pizzas initiales
export async function addInitialPizzas() {
  if (!db) return;
  
  const pizzasRef = collection(db, 'pizzas');
  
  for (const pizza of INITIAL_PIZZAS) {
    await addDoc(pizzasRef, {
      ...pizza,
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
}

// Comptes de démonstration
export const DEMO_ACCOUNTS = [
  {
    email: 'admin@demo.com',
    password: 'admin123',
    userData: {
      role: 'admin' as const,
      full_name: 'Admin Demo',
      phone: '+33 1 23 45 67 89',
      address: '123 Rue de la Demo, 75001 Paris'
    }
  },
  {
    email: 'pizzeria@demo.com',
    password: 'demo123',
    userData: {
      role: 'pizzeria' as const,
      full_name: 'Pizzeria Demo',
      phone: '+33 6 98 76 54 32',
      address: '456 Avenue de la Pizzeria, 75002 Paris'
    }
  }
];

// Fonction pour créer les comptes de démonstration
export async function createDemoAccounts() {
  if (!auth || !db) return;
  
  for (const account of DEMO_ACCOUNTS) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        account.email,
        account.password
      );
      
      // Créer le profil utilisateur dans Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: account.email,
        ...account.userData,
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch (error) {
      console.log(`Compte ${account.email} existe déjà ou erreur:`, error);
    }
  }
}