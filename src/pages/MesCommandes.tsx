import React, { useState, useEffect } from 'react';
import { Clock, Package, CheckCircle, XCircle, Eye, Phone, Mail, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePizzeriaSettings } from '../hooks/usePizzeriaSettings';
import { ordersService } from '../services/firebaseService';
import type { Order } from '../types';

const statusConfig = {
  en_attente: { 
    label: 'Em espera', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: Clock 
  },
  confirmee: { 
    label: 'Confirmado', 
    color: 'bg-blue-100 text-blue-800', 
    icon: CheckCircle 
  },
  en_preparation: { 
    label: 'Em preparação', 
    color: 'bg-orange-100 text-orange-800', 
    icon: Package 
  },
  prete: { 
    label: 'Pronto', 
    color: 'bg-green-100 text-green-800', 
    icon: CheckCircle 
  },
  recuperee: { 
    label: 'Entregue', 
    color: 'bg-green-100 text-green-800', 
    icon: CheckCircle 
  },
  cancelled: { 
    label: 'Cancelado', 
    color: 'bg-red-100 text-red-800', 
    icon: XCircle 
  }
};

export default function MesCommandes() {
  const { user } = useAuth();
  const { settings } = usePizzeriaSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = ordersService.subscribeToUserOrders(user.id, (userOrders) => {
      setOrders(userOrders);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} €`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar os seus pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Os Meus Pedidos</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Acompanhe o estado dos seus pedidos em tempo real
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum pedido
            </h3>
            <p className="text-gray-600">
              Ainda não fez nenhum pedido.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const status = statusConfig[order.status];
              const StatusIcon = status?.icon || Clock;

              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <StatusIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Pedido #{order.order_number}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-3">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status?.color || 'bg-gray-100 text-gray-800'}`}>
                            {status?.label || order.status}
                          </span>
                          {order.status === 'en_preparation' && order.preparation_time && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                              <Clock className="w-4 h-4 mr-1" />
                              {order.preparation_time} minutos
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 touch-manipulation"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Detalhes
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatPrice(order.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de détails */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Detalhes do pedido #{selectedOrder.order_number}
                  </h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Statut */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Estado</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedOrder.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                      </span>
                      {selectedOrder.status === 'en_preparation' && selectedOrder.preparation_time && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                          <Clock className="w-4 h-4 mr-1" />
                          Tempo estimado: {selectedOrder.preparation_time} minutos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informations de livraison */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Informações de entrega</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {selectedOrder.user.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {selectedOrder.user.email}
                      </div>
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                        <div>
                          <strong>Nome completo:</strong> {selectedOrder.user.full_name}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Adresse de récupération */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Local de Levantamento
                    </h4>
                    <p className="text-sm text-blue-800">
                      {selectedOrder.pickup_address || settings.address}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Venha levantar a sua encomenda nesta morada
                    </p>
                  </div>

                  {/* Articles */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Artigos encomendados</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-900">{item.pizza_name}</h5>
                            <span className="text-sm font-medium text-gray-900">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          {item.size && item.size.toLowerCase() !== 'unique' && (
                            <p className="text-sm text-gray-600">Tamanho: {item.size}</p>
                          )}
                          {item.pizza_category && (
                            <p className="text-sm text-amber-600 font-medium mb-2">
                              📂 Categoria: {item.pizza_category}
                            </p>
                          )}
                          {item.removed_ingredients && item.removed_ingredients.length > 0 && (
                            <div className="text-sm text-red-600 mb-2">
                              <strong>Ingredientes removidos:</strong> {item.removed_ingredients.join(', ')}
                            </div>
                          )}
                          {item.extras && item.extras.length > 0 && item.extras.some(extra => extra.name && extra.price) && (
                            <div className="text-sm text-green-600 mb-2">
                              <strong>Extras adicionados:</strong> {item.extras.map(extra => `${extra.name} (+${extra.price}€)`).join(', ')}
                            </div>
                          )}
                          {item.custom_ingredients && item.custom_ingredients.length > 0 && (
                            <div className="text-sm text-blue-600 font-medium">
                              <strong>Ingredientes:</strong> {item.custom_ingredients.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-900">Total</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatPrice(selectedOrder.total)}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-sm text-gray-600">
                    <strong>Encomendado em:</strong> {formatDate(selectedOrder.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}