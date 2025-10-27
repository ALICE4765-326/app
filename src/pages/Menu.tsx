import { useState, useEffect } from 'react';
import { Filter, Pizza as PizzaIcon } from 'lucide-react';
import { PizzaModal } from '../components/PizzaModal';
import { useCartStore } from '../stores/cartStore';
import { pizzasService } from '../services/firebaseService';
import { InitializationService } from '../services/initializationService';
import { usePizzeriaCategories } from '../hooks/usePizzeriaCategories';
import { usePizzeriaSettings } from '../hooks/usePizzeriaSettings';
import { MOCK_PIZZAS } from '../data/mockData';
import type { Pizza, Extra } from '../types';

export function Menu() {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPizza, setSelectedPizza] = useState<Pizza | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pizzasPerPage = 9;
  const { addItem } = useCartStore();
  const { activeCategories } = usePizzeriaCategories();
  const { settings } = usePizzeriaSettings();

  // Charger les pizzas
  useEffect(() => {
    loadPizzas();
    
    // S'abonner aux mises à jour temps réel si Firebase est disponible
    let unsubscribe = () => {};
    const setupRealtimeUpdates = async () => {
      const initState = await InitializationService.autoInitialize();
      if (initState.source === 'firebase' && initState.firebaseAvailable) {
        unsubscribe = pizzasService.subscribeToActivePizzas((updatedPizzas) => {
          if (updatedPizzas.length > 0) {
            setPizzas(updatedPizzas);
          }
        });
      }
    };
    
    setupRealtimeUpdates();
    
    return () => unsubscribe();
  }, []);

  const loadPizzas = async () => {
    setLoading(true);
    try {
      const initState = await InitializationService.autoInitialize();
      
      if (initState.source === 'firebase' && initState.firebaseAvailable) {
        try {
          const firebasePizzas = await pizzasService.getAllPizzas();
          setPizzas(firebasePizzas);
        } catch (error) {
          console.warn('Erreur Firebase:', error);
          setPizzas([]);
        }
      } else {
        setPizzas([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des pizzas:', error);
      setPizzas([]);
    } finally {
      setLoading(false);
    }
  };

  // Obtenir les catégories disponibles
  const getAvailableCategories = () => {
    if (activeCategories.length > 0) {
      // Utiliser les catégories configurées
      return activeCategories.map(cat => cat.name.toLowerCase());
    } else {
      // Fallback : extraire les catégories des pizzas
      const categories = [...new Set(pizzas.map(pizza => pizza.category))];
      return categories;
    }
  };

  const availableCategories = getAvailableCategories();

  // Filtrer et trier les pizzas
  const filteredPizzas = pizzas
    .filter(pizza => {
      const matchesCategory = selectedCategory === 'all' ||
                             pizza.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesCategory;
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
  const currentPizzas = filteredPizzas.slice(indexOfFirstPizza, indexOfLastPizza);
  const totalPages = Math.ceil(filteredPizzas.length / pizzasPerPage);

  // Réinitialiser à la page 1 quand les filtres changent et scroller en haut
  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo(0, 0);
  }, [selectedCategory]);

  // Scroller en haut quand la page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const handleAddToCart = (pizza: Pizza, size: 'small' | 'medium' | 'large', removedIngredients: string[], extras: Extra[], customIngredients: string[]) => {
    addItem({
      pizza,
      size,
      quantity: 1,
      removedIngredients,
      extras,
      customIngredients
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
          <p className="text-primary-600">A carregar o menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header com logo */}
        <div className="text-center mb-6 sm:mb-8">
          {settings.logo_url && (
            <div className="flex justify-center mb-4 sm:mb-6">
              <img
                src={settings.logo_url}
                alt={settings.name}
                className="h-16 sm:h-20 md:h-24 w-auto object-contain max-w-xs"
                onError={(e) => {
                  console.error('Erro ao carregar logo do menu');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-800 mb-2 px-4">O Nosso Menu</h1>
          <p className="text-sm sm:text-base text-primary-600 px-4">Descubra os nossos deliciosos produtos artesanais</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Filtro por categoria */}
            <div className="relative w-full">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 h-5 w-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-8 py-3 text-base border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white touch-manipulation"
              >
                <option value="all">Todas as categorias</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botões de categoria - Ocultos em mobile, visibles em desktop */}
          <div className="hidden sm:flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition touch-manipulation ${
                selectedCategory === 'all'
                  ? 'bg-accent-500 text-white'
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              }`}
            >
              Todas
            </button>
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition touch-manipulation ${
                  selectedCategory === category
                    ? 'bg-accent-500 text-white'
                    : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Grille des pizzas */}
        {filteredPizzas.length === 0 ? (
          <div className="text-center py-12">
            <PizzaIcon className="h-16 w-16 text-primary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary-800 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-primary-600">
              Tente ajustar os seus filtros de pesquisa
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {currentPizzas.map((pizza) => (
                <div
                  key={pizza.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer active:scale-98 touch-manipulation"
                  onClick={() => setSelectedPizza(pizza)}
                >
                  <img
                    src={pizza.image_url}
                    alt={pizza.name}
                    className="w-full h-40 sm:h-48 object-cover"
                  />
                  <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-primary-800">{pizza.name}</h3>
                      {pizza.vegetarian && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full ml-2 flex-shrink-0">
                          Vegetariana
                        </span>
                      )}
                    </div>
                    <p className="text-primary-600 text-sm mb-4 line-clamp-2">
                      {pizza.description}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="text-sm text-primary-500">
                        {(() => {
                          // Si prix unique, l'afficher
                          if (pizza.unique_price !== undefined && pizza.unique_price > 0) {
                            return (
                              <span className="text-lg sm:text-xl font-bold text-accent-600">{pizza.unique_price}€</span>
                            );
                          }

                          // Sinon, afficher le prix minimum des tailles
                          const availablePrices = [];
                          if (pizza.prices.small > 0) availablePrices.push(pizza.prices.small);
                          if (pizza.prices.medium > 0) availablePrices.push(pizza.prices.medium);
                          if (pizza.prices.large > 0) availablePrices.push(pizza.prices.large);

                          if (availablePrices.length === 0) {
                            return <span className="text-gray-400">Preços em configuração</span>;
                          }

                          const minPrice = Math.min(...availablePrices);
                          return (
                            <>
                              A partir de <span className="text-lg sm:text-xl font-bold text-accent-600">{minPrice}€</span>
                            </>
                          );
                        })()}
                      </div>
                      <button className="w-full sm:w-auto bg-accent-500 text-white px-4 py-2.5 rounded-md hover:bg-accent-600 active:bg-accent-700 transition text-sm sm:text-base font-medium touch-manipulation">
                        Personalizar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {filteredPizzas.length > pizzasPerPage && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs sm:text-sm text-primary-600 text-center sm:text-left">
                    Mostrando {indexOfFirstPizza + 1} a {Math.min(indexOfLastPizza, filteredPizzas.length)} de {filteredPizzas.length} produtos
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 sm:px-4 py-2 text-sm border border-primary-300 rounded-md hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition touch-manipulation"
                    >
                      ← Anterior
                    </button>
                    
                    {/* Numéros de pages - Caché si trop de pages sur mobile */}
                    <div className="hidden sm:flex items-center space-x-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-3 py-2 text-sm rounded-md transition touch-manipulation ${
                            currentPage === pageNumber
                              ? 'bg-accent-500 text-white'
                              : 'border border-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      ))}
                    </div>

                    {/* Indicateur page actuelle sur mobile */}
                    <div className="sm:hidden px-3 py-2 text-sm font-medium text-primary-700">
                      {currentPage} / {totalPages}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 sm:px-4 py-2 text-sm border border-primary-300 rounded-md hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition touch-manipulation"
                    >
                      Próxima →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de personalização */}
        <PizzaModal
          pizza={selectedPizza!}
          isOpen={!!selectedPizza}
          onClose={() => setSelectedPizza(null)}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  );
}