import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { ordersService } from '../services/firebaseService';
import { audioNotificationService } from '../services/audioNotificationService';
import toast from 'react-hot-toast';
import { PizzeriaSidebar } from './Pizzeria/PizzeriaSidebar';
import { PizzeriaOrders } from './Pizzeria/PizzeriaOrders';
import { PizzeriaMenu } from './Pizzeria/PizzeriaMenu';
import { PizzeriaCategories } from './Pizzeria/PizzeriaCategories';
import { PizzeriaSettings } from './Pizzeria/PizzeriaSettings';

export function Pizzeria() {
  const previousOrderIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // S'abonner aux commandes dès l'arrivée sur l'interface pizzeria
    const unsubscribe = ordersService.subscribeToAllOrders((newOrders) => {
      const currentOrderIds = previousOrderIdsRef.current;

      // Détecter les nouvelles commandes en attente
      const hasNewOrders = newOrders.some(order =>
        !currentOrderIds.has(order.id) && order.status === 'en_attente'
      );

      // Jouer le son et afficher la notification pour les nouvelles commandes
      if (hasNewOrders && currentOrderIds.size > 0) {
        audioNotificationService.playNotification();
        toast.success('Nova encomenda recebida!', {
          duration: 4000,
        });
      }

      // Mettre à jour la liste des IDs de commandes
      previousOrderIdsRef.current = new Set(newOrders.map(o => o.id));
    });

    return unsubscribe;
  }, []);

  return (
    <div className="flex h-full">
      <PizzeriaSidebar />
      <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/pizzeria/commandes" replace />} />
          <Route path="/commandes" element={<PizzeriaOrders />} />
          <Route path="/menu" element={<PizzeriaMenu />} />
          <Route path="/categorias" element={<PizzeriaCategories />} />
          <Route path="/configuracoes" element={<PizzeriaSettings />} />
        </Routes>
      </div>
    </div>
  );
}