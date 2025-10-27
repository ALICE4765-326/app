import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, Users, Store, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedSpace, setSelectedSpace] = useState<UserRole>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, signIn, signUp } = useAuth();

  if (user) {
    if (user.selectedSpace === 'pizzeria') {
      return <Navigate to="/pizzeria" replace />;
    }
    if (user.selectedSpace === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signIn(email, password, selectedSpace);
      } else {
        await signUp(email, password, { full_name: fullName, phone, address, role: 'client' });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Entrar na sua conta' : 'Criar nova conta'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {isLogin ? 'Registar-se' : 'Entrar'}
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {isLogin && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Escolher o espaço
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSpace('client')}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                    selectedSpace === 'client'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-primary-300 text-gray-700'
                  }`}
                >
                  <Users className="h-8 w-8 mb-2" />
                  <span className="text-sm font-medium">Cliente</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSpace('pizzeria')}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                    selectedSpace === 'pizzeria'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-primary-300 text-gray-700'
                  }`}
                >
                  <Store className="h-8 w-8 mb-2" />
                  <span className="text-sm font-medium">Espaço Gestão</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSpace('admin')}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                    selectedSpace === 'admin'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-primary-300 text-gray-700'
                  }`}
                >
                  <Shield className="h-8 w-8 mb-2" />
                  <span className="text-sm font-medium">Admin</span>
                </button>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="fullName" className="sr-only">
                    Nome completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="appearance-none rounded-lg relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                      placeholder="Nome completo"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="sr-only">
                    Telefone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="appearance-none rounded-lg relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                      placeholder="Telefone"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="sr-only">
                    Morada
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="appearance-none rounded-lg relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                      placeholder="Morada completa (opcional)"
                    />
                  </div>
                </div>

              </>
            )}

            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Palavra-passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Palavra-passe"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'A processar...' : (isLogin ? 'Entrar' : 'Registar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}