import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { usePizzeriaSettings } from '../hooks/usePizzeriaSettings';

export function Home() {
  const { settings } = usePizzeriaSettings();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header minimalista */}
      <div className="bg-white border-b border-gray-200 py-6 sm:py-8">
        <div className="container mx-auto px-4 text-center">
          {settings.logo_url && (
            <div className="flex justify-center mb-3 sm:mb-4">
              <img
                src={settings.logo_url}
                alt={settings.name}
                className="h-12 sm:h-16 w-auto object-contain"
                onError={(e) => {
                  console.error('Erro ao carregar logo');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">{settings.name}</h1>
          <p className="text-sm sm:text-base text-gray-600">Contacto</p>
        </div>
      </div>

      {/* Informações de contacto */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-lg mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
            <div className="space-y-6">
              {/* Morada */}
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Morada</h3>
                  <p className="text-sm text-gray-700">{settings.address}</p>
                </div>
              </div>
              
              {/* Telefone */}
              {settings.phone && settings.phone.trim() && (
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Telefone</h3>
                    <p className="text-sm text-gray-700">{settings.phone}</p>
                  </div>
                </div>
              )}
              
              {/* Email */}
              {settings.email && settings.email.trim() && (
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Email</h3>
                    <p className="text-sm text-gray-700">{settings.email}</p>
                  </div>
                </div>
              )}

              {/* Horários */}
              {Object.values(settings.opening_hours).some(hours => hours && hours.trim()) && (
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Horários</h3>
                    <div className="space-y-1 text-sm">
                      {settings.opening_hours.monday && settings.opening_hours.monday.trim() && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Segunda</span>
                          <span className="text-gray-700">{settings.opening_hours.monday}</span>
                        </div>
                      )}
                      {settings.opening_hours.tuesday && settings.opening_hours.tuesday.trim() && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Terça</span>
                          <span className="text-gray-700">{settings.opening_hours.tuesday}</span>
                        </div>
                      )}
                      {settings.opening_hours.wednesday && settings.opening_hours.wednesday.trim() && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quarta</span>
                          <span className="text-gray-700">{settings.opening_hours.wednesday}</span>
                        </div>
                      )}
                      {settings.opening_hours.thursday && settings.opening_hours.thursday.trim() && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quinta</span>
                          <span className="text-gray-700">{settings.opening_hours.thursday}</span>
                        </div>
                      )}
                      {settings.opening_hours.friday && settings.opening_hours.friday.trim() && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sexta</span>
                          <span className="text-gray-700">{settings.opening_hours.friday}</span>
                        </div>
                      )}
                      {settings.opening_hours.saturday && settings.opening_hours.saturday.trim() && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sábado</span>
                          <span className="text-gray-700">{settings.opening_hours.saturday}</span>
                        </div>
                      )}
                      {settings.opening_hours.sunday && settings.opening_hours.sunday.trim() && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Domingo</span>
                          <span className="text-gray-700">{settings.opening_hours.sunday}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Call to action discreto */}
          <div className="text-center mt-6">
            <a
              href="/menu"
              className="inline-block bg-gray-900 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Ver Menu
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}