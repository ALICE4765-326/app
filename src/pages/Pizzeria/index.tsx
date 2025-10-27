import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PizzeriaSidebar } from '../../pages/Pizzeria/PizzeriaSidebar';
import { PizzeriaDashboard } from '../../pages/Pizzeria/PizzeriaDashboard';
import { PizzeriaOrders } from '../../pages/Pizzeria/PizzeriaOrders';
import { PizzeriaMenu } from '../../pages/Pizzeria/PizzeriaMenu';
import { PizzeriaCategories } from '../../pages/Pizzeria/PizzeriaCategories';
import { PizzeriaSettings } from '../../pages/Pizzeria/PizzeriaSettings';
import { audioNotificationService } from '../../services/audioNotificationService';

export function Pizzeria() {
  useEffect(() => {
    const unlockAudio = async () => {
      await audioNotificationService.unlockAudio();
    };

    unlockAudio();

    const handleUserInteraction = () => {
      audioNotificationService.unlockAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  return (
    <div className="min-h-full">
      <PizzeriaSidebar />
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={<PizzeriaOrders />} />
          <Route path="/commandes" element={<PizzeriaOrders />} />
          <Route path="/menu" element={<PizzeriaMenu />} />
          <Route path="/categorias" element={<PizzeriaCategories />} />
          <Route path="/configuracoes" element={<PizzeriaSettings />} />
        </Routes>
      </div>
    </div>
  );
}