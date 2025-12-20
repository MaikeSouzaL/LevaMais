export default function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
      <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-slate-800">Bem-vindo ao Leva+ Admin</h1>
      <p className="text-slate-500 max-w-md">
        Este é o painel de controle administrativo. Por enquanto, apenas o módulo de 
        <strong> Configurações &gt; Tipos de Serviço</strong> está implementado (MVP).
      </p>
      <a 
        href="/settings/purposes" 
        className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-600 transition-transform hover:scale-105"
      >
        Acessar Tipos de Serviço
      </a>
    </div>
  );
}
