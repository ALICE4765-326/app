// Script temporaire pour supprimer TOUTES les catégories de Firebase
// À exécuter dans la console du navigateur

import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function cleanAllCategories() {
  if (!db) {
    console.error('Firebase non disponible');
    return;
  }

  try {
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);

    console.log(`Suppression de ${snapshot.size} catégories...`);

    for (const doc of snapshot.docs) {
      console.log('Suppression:', doc.id, doc.data());
      await deleteDoc(doc.ref);
    }

    console.log('Toutes les catégories ont été supprimées');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exporter pour utilisation dans la console
(window as any).cleanAllCategories = cleanAllCategories;
