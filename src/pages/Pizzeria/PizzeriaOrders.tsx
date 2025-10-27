import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Package, Truck, Phone, Mail, MapPin, Eye, Trash2 } from 'lucide-react';
import { ordersService } from '../../services/firebaseService';
import { usePizzeriaSettings } from '../../hooks/usePizzeriaSettings';
import toast from 'react-hot-toast';
import type { Order, OrderStatus } from '../../types';

const statusConfig = {
  en_attente: { label: 'Em Espera', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmee: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  en_preparation: { label: 'Em Preparação', color: 'bg-orange-100 text-orange-800', icon: Package },
  prete: { label: 'Pronta', color: 'bg-green-100 text-green-800', icon: Truck },
  recuperee: { label: 'Entregue', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: XCircle }
};

export function PizzeriaOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { settings } = usePizzeriaSettings();
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 20;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [preparationTime, setPreparationTime] = useState(10);

  useEffect(() => {
    const unsubscribe = ordersService.subscribeToAllOrders((newOrders) => {
      setOrders(newOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter(order => order.status === selectedStatus);

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await ordersService.updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const handleEditPreparationTime = (order: Order) => {
    setEditingOrder(order);
    setPreparationTime(order.preparation_time || 10);
    setShowTimeModal(true);
  };

  const handleUpdatePreparationTime = async () => {
    if (!editingOrder) return;

    try {
      await ordersService.updateOrderPreparationTime(editingOrder.id, preparationTime);
      toast.success(`Tempo de preparação atualizado (${preparationTime} min)`);
      setShowTimeModal(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erro ao atualizar o tempo');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  // Réinitialiser la page lors du changement de filtre et scroller en haut
  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo(0, 0);
  }, [selectedStatus]);

  // Scroller en haut quand la page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const handleDeleteAllOrders = async () => {
    const correctPassword = settings?.delete_password || 'delete123';

    if (password !== correctPassword) {
      toast.error('Senha incorreta!');
      return;
    }

    setIsDeleting(true);
    try {
      await ordersService.deleteAllOrders();
      toast.success('Todas as encomendas foram eliminadas com sucesso!');
      setShowDeleteModal(false);
      setPassword('');
    } catch (error) {
      console.error('Erro ao eliminar encomendas:', error);
      toast.error('Erro ao eliminar as encomendas.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestão de Encomendas</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as OrderStatus | 'all')}
            className="w-full sm:w-auto px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Todos os Estados</option>
            <option value="en_attente">Em Espera</option>
            <option value="confirmee">Confirmada</option>
            <option value="en_preparation">Em Preparação</option>
            <option value="prete">Pronta</option>
            <option value="recuperee">Entregue</option>
            <option value="cancelled">Cancelada</option>
          </select>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 text-base border border-red-300 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Eliminar Todas
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma Encomenda</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedStatus === 'all' 
              ? 'Nenhuma encomenda no momento.'
              : `Nenhuma encomenda com o estado "${statusConfig[selectedStatus as OrderStatus]?.label}".`
            }
          </p>
        </div>
      ) : (
        <>
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {/* Pagination en haut si plus de 20 commandes */}
          {filteredOrders.length > ordersPerPage && (
            <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Mostrando {indexOfFirstOrder + 1} a {Math.min(indexOfLastOrder, filteredOrders.length)} de {filteredOrders.length} encomendas
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    ← Anterior
                  </button>
                  <span className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="block sm:hidden">
            {/* Version mobile */}
            {currentOrders.map((order) => {
              const StatusIcon = statusConfig[order.status]?.icon || Clock;
              return (
                <div key={order.id} className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <StatusIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">
                          #{order.order_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {statusConfig[order.status]?.label || order.status}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="font-medium text-gray-900">{order.user.full_name}</p>
                    <p className="text-sm text-gray-600">{formatPrice(order.total)}</p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="en_attente">Em Espera</option>
                      <option value="confirmee">Confirmada</option>
                      <option value="en_preparation">Em Preparação</option>
                      <option value="prete">Pronta</option>
                      <option value="recuperee">Entregue</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                    {order.status === 'en_preparation' && (
                      <button
                        onClick={() => handleEditPreparationTime(order)}
                        className="w-full inline-flex items-center justify-center px-3 py-2 border border-orange-300 shadow-sm text-sm leading-4 font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 touch-manipulation"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        {order.preparation_time || 10} min
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 touch-manipulation"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <ul className="hidden sm:block divide-y divide-gray-200">
            {currentOrders.map((order) => {
              const StatusIcon = statusConfig[order.status]?.icon || Clock;
              return (
                <li key={order.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <StatusIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Encomenda #{order.order_number}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                            {statusConfig[order.status]?.label || order.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatDate(order.created_at)}</span>
                          <span>{formatPrice(order.total)}</span>
                          <span>{order.user.full_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="en_attente">Em Espera</option>
                        <option value="confirmee">Confirmada</option>
                        <option value="en_preparation">Em Preparação</option>
                        <option value="prete">Pronta</option>
                        <option value="recuperee">Entregue</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                      {order.status === 'en_preparation' && (
                        <button
                          onClick={() => handleEditPreparationTime(order)}
                          className="inline-flex items-center px-3 py-1 border border-orange-300 shadow-sm text-sm leading-4 font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          {order.preparation_time || 10} min
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Pagination en bas si plus de 20 commandes */}
          {filteredOrders.length > ordersPerPage && (
            <div className="px-4 sm:px-6 py-4 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-700 text-center sm:text-left">
                  Mostrando {indexOfFirstOrder + 1} a {Math.min(indexOfLastOrder, filteredOrders.length)} de {filteredOrders.length} encomendas
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition touch-manipulation"
                  >
                    ← Anterior
                  </button>

                  {/* Numéros de pages */}
                  <div className="hidden sm:flex items-center space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-3 py-2 text-sm rounded-md transition touch-manipulation ${
                          currentPage === pageNumber
                            ? 'bg-orange-500 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>

                  {/* Indicateur page actuelle sur mobile */}
                  <div className="sm:hidden px-3 py-2 text-sm font-medium text-gray-700">
                    {currentPage} / {totalPages}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition touch-manipulation"
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </>
      )}

      {/* Modal de détails */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Detalhes da Encomenda #{selectedOrder.order_number}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 p-2 -m-2 touch-manipulation"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Informations client */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Informações do Cliente</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{selectedOrder.user.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{selectedOrder.user.email}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{selectedOrder.user.address}</span>
                    </div>
                  </div>
                </div>

                {/* Articles commandés */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Artigos Encomendados</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium text-sm sm:text-base">{item.pizza_name}</span>
                            <span className="font-medium text-sm sm:text-base ml-2">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Quantidade: {item.quantity} × {formatPrice(item.price)}
                          </div>
                          {item.pizza_category && (
                            <div className="text-sm text-amber-600 font-medium mt-1">
                              📂 Categoria: {item.pizza_category}
                            </div>
                          )}
                          {item.removed_ingredients && item.removed_ingredients.length > 0 && (
                            <div className="text-sm text-red-600 mt-1">
                              🚫 Sans: {item.removed_ingredients.join(', ')}
                            </div>
                          )}
                          {item.extras && item.extras.length > 0 && item.extras.some(extra => extra.name && extra.price) && (
                            <div className="text-sm text-green-600 mt-1">
                              ➕ Extras: {item.extras.map(extra => `${extra.name} (+${extra.price}€)`).join(', ')}
                            </div>
                          )}
                          {item.custom_ingredients && item.custom_ingredients.length > 0 && (
                            <div className="text-sm text-blue-600 mt-1 font-medium">
                              Ingredientes : {item.custom_ingredients.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-base sm:text-lg font-medium">
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Statut et date */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600">
                  <span>Encomendado em {formatDate(selectedOrder.created_at)}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedOrder.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Eliminar Todas as Encomendas
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                Esta ação é irreversível. Todas as encomendas serão permanentemente eliminadas.
              </p>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Digite a senha para confirmar:
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={isDeleting}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPassword('');
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAllOrders}
                  disabled={isDeleting || !password}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'A eliminar...' : 'Eliminar Todas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modificação do tempo de preparação */}
      {showTimeModal && editingOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-orange-100 rounded-full mb-4">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Tempo de Preparação
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                Encomenda #{editingOrder.order_number}
              </p>
              <div className="mb-6">
                <label htmlFor="prep-time" className="block text-sm font-medium text-gray-700 mb-2">
                  Tempo estimado (minutos):
                </label>
                <input
                  id="prep-time"
                  type="number"
                  min="1"
                  max="120"
                  value={preparationTime}
                  onChange={(e) => setPreparationTime(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center text-2xl font-bold"
                />
                <div className="flex justify-center gap-2 mt-3">
                  <button
                    onClick={() => setPreparationTime(Math.max(1, preparationTime - 5))}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    -5 min
                  </button>
                  <button
                    onClick={() => setPreparationTime(10)}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    10 min
                  </button>
                  <button
                    onClick={() => setPreparationTime(preparationTime + 5)}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    +5 min
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTimeModal(false);
                    setEditingOrder(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdatePreparationTime}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}