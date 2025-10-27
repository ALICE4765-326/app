import { useState, useEffect } from 'react';
import { Save, Upload, MapPin, Phone, Mail, Clock, Building, Volume2, VolumeX } from 'lucide-react';
import { usePizzeriaSettings } from '../../hooks/usePizzeriaSettings';
import { audioNotificationService } from '../../services/audioNotificationService';

interface PizzeriaSettings {
  logo_url: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  delete_password: string;
  opening_hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
}

export function PizzeriaSettings() {
  const { settings: firestoreSettings, loading: loadingSettings, updateSettings } = usePizzeriaSettings();
  const [settings, setSettings] = useState<PizzeriaSettings>(firestoreSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(audioNotificationService.getEnabled());
  const [audioVolume, setAudioVolume] = useState(audioNotificationService.getVolume() * 100);

  useEffect(() => {
    setSettings(firestoreSettings);
  }, [firestoreSettings]);

  // Validar email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 Sauvegarde des paramètres dans Firestore');
    setIsSaving(true);
    setMessage(null);

    try {
      if (!settings.name.trim()) {
        throw new Error('O nome da pizzaria é obrigatório');
      }

      if (settings.email.trim() && !isValidEmail(settings.email)) {
        setMessage({ type: 'error', text: 'O formato do email não é válido' });
        return;
      }

      if (!settings.address.trim()) {
        setMessage({ type: 'error', text: 'A morada é obrigatória' });
        return;
      }

      const success = await updateSettings(settings);

      if (success) {
        setMessage({ type: 'success', text: 'Configurações guardadas com sucesso!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Erro ao guardar as configurações' });
      }

    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao guardar as configurações' });
    } finally {
      setIsSaving(false);
    }
  };

  // Atualizar campo
  const updateField = (field: keyof PizzeriaSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // Atualizar horário
  const updateOpeningHour = (day: keyof PizzeriaSettings['opening_hours'], value: string) => {
    setSettings(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: value
      }
    }));
  };

  const dayLabels = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  const handleToggleAudio = () => {
    const newValue = !audioEnabled;
    setAudioEnabled(newValue);
    audioNotificationService.setEnabled(newValue);
  };

  const handleVolumeChange = (value: number) => {
    setAudioVolume(value);
    audioNotificationService.setVolume(value / 100);
  };

  const handleTestSound = async () => {
    await audioNotificationService.playNotification();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3">
          <Building className="h-8 w-8 text-accent-500" />
          <div>
            <h1 className="text-3xl font-bold text-primary-800">Configurações</h1>
            <p className="text-primary-600">Personalize as suas informações</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Logo
          </h2>
          
          <div className="space-y-4">
            {settings.logo_url && (
              <div className="flex justify-center">
                <img
                  src={settings.logo_url}
                  alt="Logo da pizzaria"
                  className="h-24 w-24 object-contain rounded-lg border"
                  onError={(e) => {
                    console.error('Erro ao carregar logo');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                URL do Logo
              </label>
              <input
                type="url"
                value={settings.logo_url}
                onChange={(e) => updateField('logo_url', e.target.value)}
                className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="https://exemplo.com/logo.png"
              />
              <p className="text-xs text-primary-500 mt-1">
                Cole aqui o link da sua imagem de logo
              </p>
            </div>
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Informações Básicas
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
              required
            />
          </div>
        </div>

        {/* Contactos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Contactos
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Morada de Levantamento *
              </label>
              <textarea
                value={settings.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                rows={3}
                required
                placeholder="Insira a morada onde os clientes podem levantar os seus pedidos"
              />
              <p className="text-xs text-primary-500 mt-1">
                Esta morada será exibida aos clientes no resumo dos seus pedidos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Telefone
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Horários */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Horários de Funcionamento
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(dayLabels).map(([day, label]) => (
              <div key={day}>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {label}
                </label>
                <input
                  type="text"
                  value={settings.opening_hours[day as keyof typeof settings.opening_hours]}
                  onChange={(e) => updateOpeningHour(day as keyof typeof settings.opening_hours, e.target.value)}
                  className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="11h30 - 22h30"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notificações Sonoras */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center">
            <Volume2 className="h-5 w-5 mr-2" />
            Notificações Sonoras
          </h2>

          <div className="space-y-6">
            {/* Toggle Ativar/Desativar */}
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {audioEnabled ? (
                  <Volume2 className="h-6 w-6 text-accent-500" />
                ) : (
                  <VolumeX className="h-6 w-6 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-primary-800">Som de Notificação</p>
                  <p className="text-sm text-primary-600">
                    {audioEnabled ? 'Ativado' : 'Desativado'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  audioEnabled ? 'bg-accent-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    audioEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Controle de Volume */}
            {audioEnabled && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-primary-700">
                    Volume: {Math.round(audioVolume)}%
                  </label>
                  <button
                    type="button"
                    onClick={handleTestSound}
                    className="text-sm text-accent-500 hover:text-accent-600 font-medium"
                  >
                    Testar Som
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioVolume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer accent-accent-500"
                />
              </div>
            )}

            <p className="text-sm text-primary-600">
              {audioEnabled
                ? 'Receberá um som de notificação sempre que uma nova encomenda chegar.'
                : 'Ative para receber alertas sonoros de novas encomendas.'}
            </p>
          </div>
        </div>

        {/* Botão de Guardar */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-end space-x-4">
            {/* Message à côté du bouton */}
            {message && (
              <div className={`px-3 py-2 rounded-md text-sm font-medium ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-red-100 text-red-700 border border-red-300'
              }`}>
                {message.text}
              </div>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 bg-accent-500 text-white px-6 py-3 rounded-md hover:bg-accent-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Save className="h-5 w-5" />
              <span>{isSaving ? 'A guardar...' : 'Guardar Configurações'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}