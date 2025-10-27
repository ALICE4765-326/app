import { useState, useEffect } from 'react';
import { categoriesService } from '../services/firebaseService';
import { InitializationService } from '../services/initializationService';

interface Category {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at?: string;
}

export function usePizzeriaCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les catégories au démarrage
  useEffect(() => {
    let unsubscribeFirebase: (() => void) | null = null;

    const loadCategories = async () => {
      setLoading(true);
      setCategories([]);

      if (InitializationService.isFirebaseAvailable()) {
        try {
          const firebaseCategories = await categoriesService.getAllCategories();
          setCategories(firebaseCategories);

          unsubscribeFirebase = categoriesService.subscribeToCategories((updatedCategories) => {
            setCategories(updatedCategories);
          });
        } catch (error) {
          console.error('Erreur Firebase pour les catégories:', error);
          setCategories([]);
        }
      }

      setLoading(false);
    };

    loadCategories();

    return () => {
      if (unsubscribeFirebase) {
        unsubscribeFirebase();
      }
    };
  }, []);

  const addCategory = async (categoryData: Omit<Category, 'id' | 'created_at'>) => {
    try {
      if (InitializationService.isFirebaseAvailable()) {
        // Sauvegarder uniquement dans Firebase
        const newCategoryId = await categoriesService.createCategory(categoryData);
        console.log('✅ Catégorie créée dans Firebase avec ID:', newCategoryId);
        
        // Les catégories seront mises à jour automatiquement via l'abonnement temps réel
      } else {
        throw new Error('Firebase non disponible - impossible de créer la catégorie');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la catégorie:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<Category>) => {
    try {
      if (InitializationService.isFirebaseAvailable()) {
        // Mettre à jour uniquement dans Firebase
        await categoriesService.updateCategory(id, categoryData);
        console.log('✅ Catégorie mise à jour dans Firebase');
        
        // Les catégories seront mises à jour automatiquement via l'abonnement temps réel
      } else {
        throw new Error('Firebase non disponible - impossible de modifier la catégorie');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la catégorie:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      if (InitializationService.isFirebaseAvailable()) {
        // Supprimer uniquement de Firebase
        await categoriesService.deleteCategory(id);
        console.log('✅ Catégorie supprimée de Firebase');
        
        // Les catégories seront mises à jour automatiquement via l'abonnement temps réel
      } else {
        throw new Error('Firebase non disponible - impossible de supprimer la catégorie');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      throw error;
    }
  };

  const toggleActive = async (id: string) => {
    const category = categories.find(cat => cat.id === id);
    if (category) {
      await updateCategory(id, { active: !category.active });
    }
  };

  const getActiveCategories = () => {
    return categories.filter(cat => cat.active);
  };

  return {
    categories,
    activeCategories: getActiveCategories(),
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleActive
  };
}