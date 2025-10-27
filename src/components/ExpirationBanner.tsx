import { AlertTriangle } from 'lucide-react';

export function ExpirationBanner() {
  return (
    <div className="bg-red-600 text-white py-4 px-4 text-center">
      <div className="flex items-center justify-center space-x-3">
        <AlertTriangle className="h-6 w-6" />
        <p className="text-lg font-semibold">
          Prazo de teste expirado. Contactar Digismart.
        </p>
      </div>
    </div>
  );
}
