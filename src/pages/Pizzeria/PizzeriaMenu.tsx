import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Eye, EyeOff, Settings, Copy } from 'lucide-react';
import { pizzasService } from '../../services/firebaseService';
import { extrasService } from '../../services/firebaseService';
import { InitializationService } from '../../services/initializationService';
import { usePizzeriaCategories } from '../../hooks/usePizzeriaCategories';
import { useAuth } from '../../hooks/useAuth';
import { MOCK_PIZZAS } from '../../data/mockData';
import type { Pizza, Extra } from '../../types';

interface PizzaFormData {
  name: string;
  description: string;
  image_url: string;
  prices: {
    small: number;
    medium: number;
    large: number;
  };
  unique_price?: number;
  has_unique_price: boolean;
  ingredients: string[];
  category: string;
  vegetarian: boolean;
  active: boolean;
  customizable: boolean;
  max_custom_ingredients: number;
  custom_ingredients: string[];
}

interface ExtraFormData {
  name: string;
  price: number;
}

const initialFormData: PizzaFormData = {
  name: '',
  description: '',
  image_url: '',
  prices: {
    small: 0,
    medium: 0,
    large: 0
  },
  unique_price: undefined,
  has_unique_price: false,
  ingredients: [],
  category: '',
  vegetarian: false,
  active: true,
  customizable: false,
  max_custom_ingredients: 3,
  custom_ingredients: []
};

export function PizzeriaMenu() {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const { activeCategories } = usePizzeriaCategories();
  const { user } = useAuth();
  const isMasterAccount = user?.email === 'master@pizzeria.com';
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const pizzasPerPage = 8;
  const [showModal, setShowModal] = useState(false);
  const [showInitModal, setShowInitModal] = useState(false);
  const [editingPizza, setEditingPizza] = useState<Pizza | null>(null);
  const [formData, setFormData] = useState<PizzaFormData>(initialFormData);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [showExtraFormModal, setShowExtraFormModal] = useState(false);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
  const [extraFormData, setExtraFormData] = useState<ExtraFormData>({ name: '', price: 0 });
  const [loadingExtras, setLoadingExtras] = useState(false);

  // Écouter les changements de catégories
  useEffect(() => {
    const handleCategoriesUpdate = () => {
      // Forcer le re-render quand les catégories changent
      setFormData(prev => ({ ...prev }));
    };

    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    return () => window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
  }, []);

  // Écouter les pizzas en temps réel
  useEffect(() => {
    setLoading(true);
    const unsubscribe = pizzasService.subscribeToAllPizzas((firebasePizzas) => {
      setPizzas(firebasePizzas);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Charger les extras au démarrage
  useEffect(() => {
    loadExtras();
  }, []);

  const loadExtras = async () => {
    setLoadingExtras(true);
    try {
      if (InitializationService.isFirebaseAvailable()) {
        const firebaseExtras = await extrasService.getAllExtras();
        setExtras(firebaseExtras);
      } else {
        // Extras par défaut en mode mock
        setExtras([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des extras:', error);
      setExtras([]);
    } finally {
      setLoadingExtras(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    console.log('🍕 Début de soumission du formulaire');
    console.log('📝 Données du formulaire:', formData);

    // Vérifier si au moins un prix est défini (prix unique ou une taille)
    const hasUniquePrice = formData.has_unique_price && formData.unique_price && formData.unique_price > 0;
    const hasSizePrice = (!formData.has_unique_price) && (
      (formData.prices.small > 0) ||
      (formData.prices.medium > 0) ||
      (formData.prices.large > 0)
    );

    console.log('💰 Validation des prix:', { hasUniquePrice, hasSizePrice, prices: formData.prices });

    if (!hasUniquePrice && !hasSizePrice) {
      console.log('❌ Échec de validation: aucun prix défini');
      alert('⚠️ Atenção: Deve definir pelo menos um preço (preço único ou pelo menos um tamanho).');
      setIsSaving(false);
      return;
    }

    console.log('✅ Validation OK, sauvegarde en cours...');

    try {
      if (InitializationService.isFirebaseAvailable()) {
        console.log('🔥 Firebase disponible, sauvegarde dans Firebase...');
        if (editingPizza) {
          // Modifier une pizza existante
          console.log('📝 Modification de la pizza:', editingPizza.id);
          await pizzasService.updatePizza(editingPizza.id, formData);
        } else {
          // Créer une nouvelle pizza
          console.log('➕ Création d\'une nouvelle pizza');
          const newId = await pizzasService.createPizza(formData);
          console.log('✅ Pizza créée avec ID:', newId);
        }
        // Recharger les pizzas
        console.log('🔄 Rechargement des pizzas...');
      } else {
        console.log('💾 Mode mock, sauvegarde locale...');
        // Mode mock - simuler l'ajout/modification
        if (editingPizza) {
          setPizzas(prev => prev.map(p =>
            p.id === editingPizza.id
              ? { ...p, ...formData }
              : p
          ));
        } else {
          const newPizza: Pizza = {
            id: Date.now().toString(),
            ...formData
          };
          setPizzas(prev => [...prev, newPizza]);
        }
      }

      console.log('✅ Sauvegarde réussie, fermeture du modal');
      setShowModal(false);
      setEditingPizza(null);
      setFormData(initialFormData);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      alert('Erro ao guardar a pizza: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
      console.log('🏁 Fin de la soumission');
    }
  };

  const handleEdit = (pizza: Pizza) => {
    setEditingPizza(pizza);
    setFormData({
      name: pizza.name,
      description: pizza.description,
      image_url: pizza.image_url,
      prices: pizza.prices,
      has_unique_price: pizza.has_unique_price || false,
      unique_price: pizza.unique_price,
      ingredients: pizza.ingredients,
      category: pizza.category,
      vegetarian: pizza.vegetarian,
      active: true,
      customizable: pizza.customizable || false,
      max_custom_ingredients: pizza.max_custom_ingredients || 3,
      custom_ingredients: pizza.custom_ingredients || []
    });
    setShowModal(true);
  };

  const handleDelete = async (pizza: Pizza) => {
    if (!confirm(`Tem a certeza que deseja eliminar "${pizza.name}"?`)) {
      return;
    }

    try {
      if (InitializationService.isFirebaseAvailable()) {
        await pizzasService.deletePizza(pizza.id);
      } else {
        setPizzas(prev => prev.filter(p => p.id !== pizza.id));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erro ao eliminar a pizza');
    }
  };

  const handleToggleActive = async (pizza: Pizza) => {
    try {
      const currentActiveState = (pizza as any).active ?? true;
      const newActiveState = !currentActiveState;
      
      if (InitializationService.isFirebaseAvailable()) {
        await pizzasService.updatePizza(pizza.id, { active: newActiveState });
      } else {
        setPizzas(prev => prev.map(p => 
          p.id === pizza.id 
            ? { ...p, active: newActiveState } as Pizza
            : p
        ));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erro ao atualizar a pizza');
    }
  };

  const handleInitializePizzas = async () => {
    setIsInitializing(true);
    try {
      const success = await InitializationService.initializePizzasInFirebase();
      if (success) {
        alert('✅ Pizzas de demonstração adicionadas com sucesso!');
        setShowInitModal(false);
      } else {
        alert('❌ Erro ao adicionar as pizzas');
      }
    } catch (error) {
      alert('❌ Erro: ' + (error as Error).message);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSyncToFirebase = async () => {
    if (!InitializationService.isFirebaseAvailable()) {
      alert('❌ Firebase não está disponível');
      return;
    }

    if (!confirm('Deseja sincronizar todas as pizzas atuais para o Firebase? Esta ação adicionará as pizzas em falta.')) {
      return;
    }

    setIsSyncing(true);
    try {
      console.log('🔄 Début de la synchronisation...');
      console.log('📊 Pizzas à synchroniser:', pizzas.length);
      
      let syncedCount = 0;
      let errorCount = 0;
      
      for (const pizza of pizzas) {
        try {
          console.log(`🍕 Synchronisation de: ${pizza.name}`);
          
          // Créer la pizza dans Firebase
          const pizzaData = {
            name: pizza.name,
            description: pizza.description,
            image_url: pizza.image_url,
            prices: pizza.prices,
            ingredients: pizza.ingredients,
            category: pizza.category,
            vegetarian: pizza.vegetarian,
            active: (pizza as any).active !== false
          };
          
          console.log('📝 Données pizza:', pizzaData);
          
          const newPizzaId = await pizzasService.createPizza(pizzaData);
          console.log(`✅ Pizza créée avec ID: ${newPizzaId}`);
          syncedCount++;
        } catch (error: any) {
          console.error(`❌ Erreur lors de la sync de ${pizza.name}:`, error);
          
          // Si c'est une erreur de permissions, arrêter la synchronisation
          if (error.message.includes('Permissions insuffisantes') || error.message.includes('Profil utilisateur')) {
            alert(`❌ Erro de permissões: ${error.message}\n\nVerifique o seu papel na Firebase Console:\n1. Vá para Firestore Database > Coleção "users"\n2. Encontre o seu documento de utilizador\n3. Verifique se o campo "role" está definido como "pizzeria"`);
            setIsSyncing(false);
            return;
          }
          
          errorCount++;
        }
      }
      
      console.log(`📊 Résultat: ${syncedCount} succès, ${errorCount} erreurs`);
      
      if (syncedCount > 0) {
        alert(`✅ Sincronização concluída! ${syncedCount} pizzas sincronizadas para o Firebase.`);
      } else if (errorCount > 0) {
        alert(`❌ Erro ao sincronizar. ${errorCount} pizzas não puderam ser sincronizadas. Verifique a consola para mais detalhes.`);
      } else {
        alert(`ℹ️ Nenhuma pizza para sincronizar (todas já existem ou outro problema).`);
      }
      
      // Recharger les pizzas depuis Firebase
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      alert('❌ Erro ao sincronizar: ' + (error as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExtraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (InitializationService.isFirebaseAvailable()) {
        if (editingExtra) {
          await extrasService.updateExtra(editingExtra.id, extraFormData);
        } else {
          await extrasService.createExtra(extraFormData);
        }
        await loadExtras();
      } else {
        // Mode mock
        if (editingExtra) {
          setExtras(prev => prev.map(e => 
            e.id === editingExtra.id 
              ? { ...e, ...extraFormData }
              : e
          ));
        } else {
          const newExtra: Extra = {
            id: Date.now().toString(),
            ...extraFormData
          };
          setExtras(prev => [...prev, newExtra]);
        }
      }

      setShowExtraFormModal(false);
      setEditingExtra(null);
      setExtraFormData({ name: '', price: 0 });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'extra:', error);
      alert('Erro ao guardar o extra');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditExtra = (extra: Extra) => {
    setEditingExtra(extra);
    setExtraFormData({
      name: extra.name,
      price: extra.price
    });
    setShowExtraFormModal(true);
  };

  const handleDeleteExtra = async (extra: Extra) => {
    if (!confirm(`Tem a certeza que deseja eliminar "${extra.name}"?`)) {
      return;
    }

    try {
      if (InitializationService.isFirebaseAvailable()) {
        await extrasService.deleteExtra(extra.id);
        await loadExtras();
      } else {
        setExtras(prev => prev.filter(e => e.id !== extra.id));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'extra:', error);
      alert('Erro ao eliminar o extra');
    }
  };

  const handleMarkAllAsTemplates = async () => {
    if (!confirm('Marcar todas as pizzas como templates? Estas pizzas serão copiadas para novos utilizadores.')) {
      return;
    }

    setIsSyncing(true);
    try {
      let updatedCount = 0;

      for (const pizza of pizzas) {
        if (InitializationService.isFirebaseAvailable()) {
          await pizzasService.updatePizza(pizza.id, { is_template: true });
          updatedCount++;
        }
      }

      alert(`✅ ${updatedCount} pizzas marcadas como templates!`);
    } catch (error) {
      console.error('Erro ao marcar pizzas como templates:', error);
      alert('Erro ao marcar pizzas como templates');
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtrer et trier les pizzas
  const filteredAndSortedPizzas = [...pizzas]
    .filter(pizza => {
      if (selectedCategory === 'all') return true;
      return pizza.category.toLowerCase() === selectedCategory.toLowerCase();
    })
    .sort((a, b) => {
      // D'abord par catégorie
      const categoryCompare = a.category.localeCompare(b.category);
      if (categoryCompare !== 0) return categoryCompare;
      // Puis par nom alphabétique
      return a.name.localeCompare(b.name);
    });

  // Calculer les pizzas pour la page actuelle
  const indexOfLastPizza = currentPage * pizzasPerPage;
  const indexOfFirstPizza = indexOfLastPizza - pizzasPerPage;
  const currentPizzas = filteredAndSortedPizzas.slice(indexOfFirstPizza, indexOfLastPizza);
  const totalPages = Math.ceil(filteredAndSortedPizzas.length / pizzasPerPage);

  // Réinitialiser à la page 1 uniquement quand le filtre change et scroller en haut
  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo(0, 0);
  }, [selectedCategory]);

  // Scroller en haut quand la page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  // Obtenir les catégories disponibles
  const availableCategories = activeCategories.length > 0
    ? activeCategories.map(cat => cat.name)
    : [...new Set(pizzas.map(pizza => pizza.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800 mx-auto mb-4"></div>
          <p className="text-primary-600">Chargement des pizzas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-full">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary-800 mb-2">Gestão do Menu</h1>
            <p className="text-primary-600">Adicione, modifique e gira</p>
          </div>
          <div className="flex space-x-3">
            {isMasterAccount && (
              <button
                onClick={handleMarkAllAsTemplates}
                disabled={isSyncing || pizzas.length === 0}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Marcar todas as pizzas como templates para novos utilizadores"
              >
                <Copy className="h-5 w-5" />
                <span>{isSyncing ? 'A guardar...' : 'Marcar como Templates'}</span>
              </button>
            )}
            <button
              onClick={() => setShowExtrasModal(true)}
              className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition"
            >
              <Settings className="h-5 w-5" />
              <span>Gerir Extras</span>
            </button>
            <button
              onClick={() => {
                setEditingPizza(null);
                setFormData(initialFormData);
                setShowModal(true);
              }}
              className="flex items-center space-x-2 bg-accent-500 text-white px-4 py-2 rounded-md hover:bg-accent-600 transition"
            >
              <Plus className="h-5 w-5" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <label className="text-sm font-medium text-primary-700 flex-shrink-0">
            Filtrar por categoria:
          </label>
          <div className="flex flex-wrap gap-2 flex-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-accent-500 text-white'
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              }`}
            >
              Todas ({pizzas.length})
            </button>
            {availableCategories.map((category) => {
              const count = pizzas.filter(p => p.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedCategory === category
                      ? 'bg-accent-500 text-white'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-primary-800">Total</h3>
          <p className="text-2xl font-bold text-accent-600">{filteredAndSortedPizzas.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-primary-800">Ativas</h3>
          <p className="text-2xl font-bold text-green-600">
            {filteredAndSortedPizzas.filter(p => (p as any).active !== false).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-primary-800">Vegetarianas</h3>
          <p className="text-2xl font-bold text-purple-600">
            {filteredAndSortedPizzas.filter(p => p.vegetarian).length}
          </p>
        </div>
      </div>

      {/* Liste des pizzas */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredAndSortedPizzas.length > pizzasPerPage && (
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Mostrando {indexOfFirstPizza + 1} a {Math.min(indexOfLastPizza, filteredAndSortedPizzas.length)} de {filteredAndSortedPizzas.length} pizzas
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary-800">Artigo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary-800">Categoria</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary-800">Preço</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary-800">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary-800">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {currentPizzas.map((pizza, index) => {
                // Vérifier si c'est la première pizza d'une nouvelle catégorie
                const isFirstInCategory = index === 0 ||
                  currentPizzas[index - 1].category !== pizza.category;

                return (
                <tr key={pizza.id} className={`hover:bg-primary-50 ${isFirstInCategory ? 'border-t-2 border-accent-200' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={pizza.image_url}
                        alt={pizza.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <div className="text-sm font-medium text-primary-800">{pizza.name}</div>
                        <div className="text-sm text-primary-600 max-w-xs truncate">
                          {pizza.description}
                        </div>
                        {pizza.vegetarian && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Vegetariana
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-primary-600 capitalize">
                    {pizza.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-primary-600">
                    <div>P: {pizza.prices.small}€</div>
                    <div>M: {pizza.prices.medium}€</div>
                    <div>G: {pizza.prices.large}€</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (pizza as any).active !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(pizza as any).active !== false ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleActive(pizza)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title={(pizza as any).active !== false ? 'Desativar' : 'Ativar'}
                      >
                        {(pizza as any).active !== false ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(pizza)}
                        className="text-accent-600 hover:text-accent-800 p-1"
                        title="Modificar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pizza)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredAndSortedPizzas.length > pizzasPerPage && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              
              {/* Numéros de pages */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-2 text-sm rounded-md ${
                    currentPage === pageNumber
                      ? 'bg-accent-500 text-white'
                      : 'border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      {filteredAndSortedPizzas.length === 0 && pizzas.length > 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-primary-600 mb-4">Nenhuma pizza nesta categoria</p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="bg-accent-500 text-white px-4 py-2 rounded-md hover:bg-accent-600 transition"
          >
            Ver todas
          </button>
        </div>
      )}

      {pizzas.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-primary-600 mb-4">Nenhuma item no menu</p>
          {!isMasterAccount && (
            <p className="text-sm text-primary-500">
              Se o master criou um menu template, ele será copiado automaticamente.
            </p>
          )}
        </div>
      )}


      {/* Modal de gestion des extras */}
      {showExtrasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary-800">Gestão de Extras</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setEditingExtra(null);
                      setExtraFormData({ name: '', price: 0 });
                      setShowExtraFormModal(true);
                    }}
                    className="flex items-center space-x-2 bg-accent-500 text-white px-4 py-2 rounded-md hover:bg-accent-600 transition"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Adicionar Extra</span>
                  </button>
                  <button
                    onClick={() => setShowExtrasModal(false)}
                    className="px-4 py-2 text-primary-600 hover:text-primary-800"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {extras.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 text-primary-300 mx-auto mb-4" />
                  <p className="text-primary-600 mb-4">Nenhum extra configurado</p>
                  <button
                    onClick={() => {
                      setEditingExtra(null);
                      setExtraFormData({ name: '', price: 0 });
                      setShowExtraFormModal(true);
                    }}
                    className="bg-accent-500 text-white px-4 py-2 rounded-md hover:bg-accent-600 transition"
                  >
                    Criar o seu primeiro extra
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-primary-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-primary-800">Nome</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-primary-800">Preço</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-primary-800">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-100">
                      {extras.map((extra) => (
                        <tr key={extra.id} className="hover:bg-primary-50">
                          <td className="px-6 py-4 text-sm font-medium text-primary-800">
                            {extra.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-primary-600">
                            {extra.price.toFixed(2)}€
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditExtra(extra)}
                                className="text-accent-600 hover:text-accent-800 p-1"
                                title="Modificar"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExtra(extra)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulaire extra */}
      {showExtraFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <form onSubmit={handleExtraSubmit} className="p-6 space-y-6">
              <h2 className="text-2xl font-bold text-primary-800">
                {editingExtra ? 'Modificar Extra' : 'Adicionar Extra'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Nome do Extra
                  </label>
                  <input
                    type="text"
                    value={extraFormData.name}
                    onChange={(e) => setExtraFormData({ ...extraFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                    placeholder="Ex: Mozzarella extra"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Preço (€)
                  </label>
                  <input
                    type="number"
                    value={extraFormData.price}
                    onChange={(e) => setExtraFormData({ ...extraFormData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowExtraFormModal(false);
                    setEditingExtra(null);
                    setExtraFormData({ name: '', price: 0 });
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 text-primary-600 hover:text-primary-800 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-accent-500 text-white rounded-md hover:bg-accent-600 disabled:opacity-50"
                >
                  {isSaving ? 'A guardar...' : (editingExtra ? 'Modificar' : 'Adicionar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal d'ajout/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <h2 className="text-2xl font-bold text-primary-800">
                {editingPizza ? 'Modificar' : 'Adicionar'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has_unique_price"
                    checked={formData.has_unique_price}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      has_unique_price: e.target.checked,
                      unique_price: e.target.checked ? 0 : undefined,
                      prices: e.target.checked ? { small: 0, medium: 0, large: 0 } : formData.prices
                    })}
                    className="rounded border-primary-300 text-accent-500 focus:ring-accent-500"
                  />
                  <label htmlFor="has_unique_price" className="text-sm font-medium text-primary-700">
                    Este item tem um preço único
                  </label>
                </div>

                {formData.has_unique_price ? (
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Preço Único (€)
                    </label>
                    <input
                      type="number"
                      value={formData.unique_price || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        unique_price: Number(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                ) : (
                <div>
                  <p className="text-sm text-primary-600 mb-3">
                    💡 Defina pelo menos um preço
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Preço (Pequena)
                    </label>
                    <input
                      type="number"
                      value={formData.prices.small || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        prices: { ...formData.prices, small: Number(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                      min="0"
                      step="0.01"
                      placeholder="0 = não disponível"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Preço (Média)
                    </label>
                    <input
                      type="number"
                      value={formData.prices.medium || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        prices: { ...formData.prices, medium: Number(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                      min="0"
                      step="0.01"
                      placeholder="0 = não disponível"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Preço (Grande)
                    </label>
                    <input
                      type="number"
                      value={formData.prices.large || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        prices: { ...formData.prices, large: Number(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                      min="0"
                      step="0.01"
                      placeholder="0 = não disponível"
                    />
                  </div>
                </div>
                </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Ingredientes
                  </label>
                  <div className="space-y-3">
                    {/* Liste des ingrédients actuels */}
                    <div className="flex flex-wrap gap-2">
                      {formData.ingredients.map((ingredient, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-accent-100 text-accent-800"
                        >
                          {ingredient}
                          <button
                            type="button"
                            onClick={() => {
                              const newIngredients = formData.ingredients.filter((_, i) => i !== index);
                              setFormData({ ...formData, ingredients: newIngredients });
                            }}
                            className="ml-2 text-accent-600 hover:text-accent-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    
                    {/* Champ pour ajouter un nouvel ingrédient */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="newIngredient"
                        placeholder="Adicionar ingrediente..."
                        className="flex-1 px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            const newIngredient = input.value.trim();
                            if (newIngredient && !formData.ingredients.includes(newIngredient)) {
                              setFormData({
                                ...formData,
                                ingredients: [...formData.ingredients, newIngredient]
                              });
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('newIngredient') as HTMLInputElement;
                          const newIngredient = input.value.trim();
                          if (newIngredient && !formData.ingredients.includes(newIngredient)) {
                            setFormData({
                              ...formData,
                              ingredients: [...formData.ingredients, newIngredient]
                            });
                            input.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-accent-500 text-white rounded-md hover:bg-accent-600 transition"
                      >
                        Adicionar
                      </button>
                    </div>
                    
                    <p className="text-xs text-primary-500">
                      Digite um ingrediente e clique "Adicionar" ou pressione Enter
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                    required
                  >
                    <option value="">Selecionar categoria</option>
                    {activeCategories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-primary-200 pt-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="customizable"
                      checked={formData.customizable}
                      onChange={(e) => setFormData({
                        ...formData,
                        customizable: e.target.checked
                      })}
                      className="rounded border-primary-300 text-accent-500 focus:ring-accent-500"
                    />
                    <label htmlFor="customizable" className="text-sm font-medium text-primary-700">
                      Personalizável (clientes podem adicionar ingredientes)
                    </label>
                  </div>

                  {formData.customizable && (
                    <div className="space-y-4 pl-6 border-l-2 border-accent-200">
                      <div>
                        <label className="block text-sm font-medium text-primary-700 mb-1">
                          Número máximo de ingredientes (1-10)
                        </label>
                        <input
                          type="number"
                          value={formData.max_custom_ingredients}
                          onChange={(e) => setFormData({
                            ...formData,
                            max_custom_ingredients: Math.min(10, Math.max(1, Number(e.target.value)))
                          })}
                          className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                          min="1"
                          max="10"
                          required
                        />
                        <p className="text-xs text-primary-500 mt-1">
                          Clientes poderão escolher até {formData.max_custom_ingredients} ingrediente(s)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-primary-700 mb-1">
                          Ingredientes disponíveis para personalização
                        </label>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {formData.custom_ingredients.map((ingredient, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                              >
                                {ingredient}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newIngredients = formData.custom_ingredients.filter((_, i) => i !== index);
                                    setFormData({ ...formData, custom_ingredients: newIngredients });
                                  }}
                                  className="ml-2 text-green-600 hover:text-green-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              id="newCustomIngredient"
                              placeholder="Ex: Cogumelos, Azeitonas..."
                              className="flex-1 px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = e.target as HTMLInputElement;
                                  const newIngredient = input.value.trim();
                                  if (newIngredient && !formData.custom_ingredients.includes(newIngredient)) {
                                    setFormData({
                                      ...formData,
                                      custom_ingredients: [...formData.custom_ingredients, newIngredient]
                                    });
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('newCustomIngredient') as HTMLInputElement;
                                const newIngredient = input.value.trim();
                                if (newIngredient && !formData.custom_ingredients.includes(newIngredient)) {
                                  setFormData({
                                    ...formData,
                                    custom_ingredients: [...formData.custom_ingredients, newIngredient]
                                  });
                                  input.value = '';
                                }
                              }}
                              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
                            >
                              Adicionar
                            </button>
                          </div>

                          <p className="text-xs text-primary-500">
                            Estes ingredientes estarão disponíveis para os clientes escolherem ao personalizar
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPizza(null);
                    setFormData(initialFormData);
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 text-primary-600 hover:text-primary-800 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-accent-500 text-white rounded-md hover:bg-accent-600 disabled:opacity-50"
                >
                  {isSaving ? 'A guardar...' : (editingPizza ? 'Modificar' : 'Adicionar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}