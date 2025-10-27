import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Users, Save, Key } from 'lucide-react';
import { useOrderStore } from '../../stores/orderStore';
import { usePizzeriaSettings } from '../../hooks/usePizzeriaSettings';

export function Dashboard() {
  const { orders, subscribeToAllOrders } = useOrderStore();
  const { settings: firestoreSettings, updateSettings } = usePizzeriaSettings();
  const [stats, setStats] = useState({
    total_orders: 0,
    total_revenue: 0,
    average_order_value: 0,
    orders_by_status: {} as Record<string, number>
  });
  const [deletePassword, setDeletePassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllOrders();
    return unsubscribe;
  }, [subscribeToAllOrders]);

  useEffect(() => {
    setDeletePassword(firestoreSettings.delete_password || 'delete123');
  }, [firestoreSettings]);

  useEffect(() => {
    const total_orders = orders.length;
    const total_revenue = orders.reduce((sum, order) => sum + order.total, 0);
    const average_order_value = total_orders > 0 ? total_revenue / total_orders : 0;

    // Compter les commandes par statut
    const orders_by_status = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      total_orders,
      total_revenue,
      average_order_value,
      orders_by_status
    });
  }, [orders]);

  const STATUS_LABELS = {
    en_attente: 'Em Espera',
    confirmee: 'Confirmada',
    en_preparation: 'Em Preparação',
    prete: 'Pronta',
    recuperee: 'Entregue'
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      if (!deletePassword.trim()) {
        setMessage({ type: 'error', text: 'A senha não pode estar vazia' });
        setIsSaving(false);
        return;
      }

      const success = await updateSettings({ delete_password: deletePassword });

      if (success) {
        setMessage({ type: 'success', text: 'Senha guardada com sucesso!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Erro ao guardar a senha' });
      }
    } catch (error: any) {
      console.error('Erro ao guardar:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao guardar a senha' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary-800">Administração - Resumo Financeiro</h1>

      {/* Statistiques financières */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Encomendas"
          value={stats.total_orders}
          icon={<ShoppingBag className="h-6 w-6" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Volume de Negócios Total"
          value={`${stats.total_revenue.toFixed(2)}€`}
          icon={<DollarSign className="h-6 w-6" />}
          color="bg-green-500"
        />
        <StatCard
          title="Carrinho Médio"
          value={`${stats.average_order_value.toFixed(2)}€`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="bg-purple-500"
        />
        <StatCard
          title="Clientes Únicos"
          value={new Set(orders.map(o => o.user_id)).size}
          icon={<Users className="h-6 w-6" />}
          color="bg-orange-500"
        />
      </div>

      {/* Résumé des commandes par statut */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-primary-800 mb-4">
          Resumo de Encomendas por Estado
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <div key={status} className="text-center p-4 bg-primary-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-800">
                {stats.orders_by_status[status] || 0}
              </div>
              <div className="text-sm text-primary-600">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Résumé financier par période */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-primary-800 mb-4">
            Receitas por Dia (Últimos 7 Dias)
          </h2>
          <div className="space-y-3">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - i);
              const dateStr = date.toISOString().split('T')[0];

              const dayOrders = orders.filter(order =>
                order.created_at.startsWith(dateStr)
              );
              const dayRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0);

              return (
                <div key={dateStr} className="flex justify-between items-center">
                  <span className="text-primary-600">
                    {date.toLocaleDateString('pt-PT', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                  <div className="text-right">
                    <div className="font-semibold text-primary-800">
                      {dayRevenue.toFixed(2)}€
                    </div>
                    <div className="text-sm text-primary-600">
                      {dayOrders.length} encomendas
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-primary-800 mb-4">
            Encomendas Recentes
          </h2>
          <div className="space-y-3">
            {orders.slice(0, 8).map((order) => (
              <div key={order.id} className="flex justify-between items-center border-b border-primary-100 pb-2">
                <div>
                  <div className="font-medium text-primary-800">
                    {order.user.full_name}
                  </div>
                  <div className="text-sm text-primary-600">
                    {new Date(order.created_at).toLocaleDateString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {order.total.toFixed(2)}€
                  </div>
                  <div className="text-sm text-primary-600">
                    {order.items.length} artigo(s)
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-primary-500 text-center">Nenhuma encomenda</p>
            )}
          </div>
        </div>
      </div>

      {/* Configuration de la senha */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center">
          <Key className="h-5 w-5 mr-2" />
          Senha de Eliminação de Encomendas
        </h2>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSavePassword} className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Senha para Eliminar Todas as Encomendas
            </label>
            <input
              type="text"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="delete123"
              required
            />
            <p className="text-xs text-primary-500 mt-1">
              Esta senha será necessária para eliminar todas as encomendas no painel de gestão da pizzaria
            </p>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 bg-accent-500 text-white px-6 py-2 rounded-md hover:bg-accent-600 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Save className="h-5 w-5" />
            <span>{isSaving ? 'A guardar...' : 'Guardar'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-4">
        <div className={`${color} p-3 rounded-full text-white`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-primary-600">{title}</p>
          <p className="text-2xl font-bold text-primary-800">{value}</p>
        </div>
      </div>
    </div>
  );
}