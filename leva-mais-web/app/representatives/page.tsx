"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Search, Edit, Trash2, ShieldCheck, Mail, Phone } from "lucide-react";
import { representativesService, Representative } from "@/services/representativesService";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function RepresentativesPage() {
  const [reps, setReps] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Representative | null>(null);
  
  const { showToast, ToastContainer } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await representativesService.getAll();
      setReps(data);
    } catch (error) {
      showToast("Erro ao carregar representantes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza? Isso removerá o acesso deste representante.")) return;
    try {
      await representativesService.delete(id);
      showToast("Representante removido", "success");
      loadData();
    } catch {
      showToast("Erro ao remover", "error");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {ToastContainer}
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            Representantes
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie os parceiros responsáveis por cada cidade.
          </p>
        </div>
        <button
          onClick={() => { setEditingRep(null); setIsModalOpen(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Representante
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {reps.length === 0 && !loading ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum representante cadastrado</h3>
          <p className="text-gray-500 mb-4">Comece adicionando um parceiro para gerenciar uma cidade.</p>
          <button
            onClick={() => { setEditingRep(null); setIsModalOpen(true); }}
            className="text-indigo-600 font-medium hover:underline"
          >
            Cadastrar agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reps.map((rep) => (
            <div key={rep._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {rep.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{rep.name}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {rep.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingRep(rep); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(rep._id!)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {rep.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {rep.phone}
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gray-400" />
                  CPF/CNPJ: {rep.cpfCnpj}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                <span>Cidades: 0</span>
                <span>Lucro: 50%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <RepresentativeModal 
          rep={editingRep} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { loadData(); setIsModalOpen(false); }} 
        />
      )}
    </div>
  );
}

function RepresentativeModal({ rep, onClose, onSuccess }: { rep: Representative | null, onClose: () => void, onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: rep?.name || "",
    email: rep?.email || "",
    phone: rep?.phone || "",
    cpfCnpj: rep?.cpfCnpj || "",
    active: rep?.active ?? true
  });
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (rep?._id) {
        await representativesService.update(rep._id, form);
      } else {
        await representativesService.create(form);
      }
      showToast("Salvo com sucesso!", "success");
      onSuccess();
    } catch {
      showToast("Erro ao salvar", "error");
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={rep ? "Editar Representante" : "Novo Representante"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
          <input 
            required 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              required type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input 
              required 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CPF ou CNPJ</label>
          <input 
            required 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.cpfCnpj}
            onChange={e => setForm({...form, cpfCnpj: e.target.value})}
          />
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <input 
            type="checkbox" 
            id="active"
            checked={form.active}
            onChange={e => setForm({...form, active: e.target.checked})}
            className="rounded text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="active" className="text-sm text-gray-700">Cadastro Ativo</label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
