export function Privacy() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-primary-800 mb-8">Política de Privacidade</h1>
      
      <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-primary-800 mb-4">1. Recolha de dados</h2>
          <p className="text-primary-600">
            Recolhemos as seguintes informações:
          </p>
          <ul className="list-disc list-inside mt-2 text-primary-600">
            <li>Nome e apelido</li>
            <li>Endereço de email</li>
            <li>Número de telefone</li>
            <li>Morada de entrega</li>
            <li>Histórico de encomendas</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary-800 mb-4">2. Utilização dos dados</h2>
          <p className="text-primary-600">
            Os dados recolhidos são utilizados para:
          </p>
          <ul className="list-disc list-inside mt-2 text-primary-600">
            <li>Processar as suas encomendas</li>
            <li>Contactá-lo sobre a sua encomenda</li>
            <li>Melhorar os nossos serviços</li>
            <li>Personalizar a sua experiência</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary-800 mb-4">3. Proteção dos dados</h2>
          <p className="text-primary-600">
            Implementamos medidas de segurança adequadas para proteger os seus dados pessoais contra qualquer acesso, modificação, divulgação ou destruição não autorizados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary-800 mb-4">4. Cookies</h2>
          <p className="text-primary-600">
            Utilizamos cookies para:
          </p>
          <ul className="list-disc list-inside mt-2 text-primary-600">
            <li>Memorizar as suas preferências</li>
            <li>Manter a sua sessão</li>
            <li>Analisar a utilização do site</li>
            <li>Melhorar os nossos serviços</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary-800 mb-4">5. Os seus direitos</h2>
          <p className="text-primary-600">
            Em conformidade com o RGPD, tem os seguintes direitos:
          </p>
          <ul className="list-disc list-inside mt-2 text-primary-600">
            <li>Direito de acesso aos seus dados</li>
            <li>Direito de retificação</li>
            <li>Direito ao apagamento</li>
            <li>Direito à limitação do tratamento</li>
            <li>Direito à portabilidade dos dados</li>
            <li>Direito de oposição</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary-800 mb-4">6. Contacto</h2>
          <p className="text-primary-600">
            Para qualquer questão sobre a nossa política de privacidade ou para exercer os seus direitos, pode contactar-nos através do endereço: privacidade@pizza-delice.pt
          </p>
        </section>
      </div>
    </div>
  );
}