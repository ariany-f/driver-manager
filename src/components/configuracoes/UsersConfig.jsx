import { useState, useEffect } from 'react';
import { Users, Trash2, Key, Plus } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';
import ConfirmModal from '../modals/ConfirmModal.jsx';

export default function UsersConfig({ enabled }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [deletingUser, setDeletingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users/list');
      if (!res.ok) throw new Error('Não foi possível carregar os usuários.');
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchUsers();
    }
  }, [enabled]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar usuário.');
      }
      setEmail('');
      setPassword('');
      setRole('user');
      setShowAddForm(false);
      fetchUsers();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !selectedUser) return;
    try {
      const res = await fetch('/api/users/update_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, password: newPassword })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar senha.');
      }
      setNewPassword('');
      setSelectedUser(null);
      setShowPasswordForm(false);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      const res = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingUser.id })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao excluir usuário.');
      }
      setDeletingUser(null);
      fetchUsers();
    } catch (e) {
      alert(e.message);
    }
  };

  if (!enabled) return null;

  return (
    <section className="bg-white border-4 border-[#2C1A14] shadow-[8px_8px_0px_#2C1A14] p-5">
      <h2 className="font-display font-black text-xl uppercase tracking-widest text-[#2C1A14] mb-4 flex items-center gap-2">
        <Users size={18} strokeWidth={2.5} /> Equipe (Usuários)
      </h2>
      
      {error && <p className="text-[#C13B22] font-bold mb-4">{error}</p>}
      
      {loading ? (
        <p className="text-sm font-bold text-[#2C1A14]/50">Carregando...</p>
      ) : (
        <div className="space-y-4">
          <ul className="divide-y-2 divide-[#2C1A14]/10 border-2 border-[#2C1A14]/10">
            {users.map(u => (
              <li key={u.id} className="p-3 flex items-center justify-between gap-4">
                <div className="overflow-hidden">
                  <p className="font-sans font-bold text-[#2C1A14] truncate">{u.email}</p>
                  <p className="font-mono text-[10px] text-[#2C1A14]/60 uppercase">{u.role}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button 
                    type="button" 
                    onClick={() => { setSelectedUser(u); setShowPasswordForm(true); }}
                    className="p-2 border-2 border-[#2C1A14] bg-[#F4EFE6] hover:bg-[#EAB308] transition-colors"
                    title="Alterar senha"
                  >
                    <Key size={14} />
                  </button>
                  {u.role !== 'master' && (
                    <button 
                      type="button" 
                      onClick={() => setDeletingUser(u)}
                      className="p-2 border-2 border-[#C13B22] bg-[#F4EFE6] text-[#C13B22] hover:bg-[#C13B22] hover:text-white transition-colors"
                      title="Excluir usuário"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {!showAddForm ? (
            <ButtonPrimary onClick={() => setShowAddForm(true)} color="bgNavy" icon={Plus}>
              Adicionar Membro
            </ButtonPrimary>
          ) : (
            <form onSubmit={handleAdd} className="bg-[#F4EFE6] border-2 border-[#2C1A14] p-4 space-y-4 mt-4">
              <h3 className="font-display font-bold uppercase tracking-widest text-[#2C1A14] text-sm">Novo Membro</h3>
              <div>
                <label className="block font-sans font-bold text-xs uppercase tracking-wider text-[#2C1A14] mb-1">E-mail</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white border-2 border-[#2C1A14] px-3 py-2 font-sans font-bold outline-none focus:ring-4 focus:ring-[#EAB308]/30 transition-all" />
              </div>
              <div>
                <label className="block font-sans font-bold text-xs uppercase tracking-wider text-[#2C1A14] mb-1">Senha</label>
                <input type="password" required minLength="6" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white border-2 border-[#2C1A14] px-3 py-2 font-sans font-bold outline-none focus:ring-4 focus:ring-[#EAB308]/30 transition-all" />
              </div>
              <div>
                <label className="block font-sans font-bold text-xs uppercase tracking-wider text-[#2C1A14] mb-1">Perfil</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-white border-2 border-[#2C1A14] px-3 py-2 font-sans font-bold outline-none focus:ring-4 focus:ring-[#EAB308]/30 transition-all">
                  <option value="user">Membro (Equipe)</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 font-display font-bold uppercase text-[#2C1A14]">Cancelar</button>
                <ButtonPrimary type="submit" color="bgOlive">Salvar</ButtonPrimary>
              </div>
            </form>
          )}

          {showPasswordForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <form onSubmit={handleUpdatePassword} className="w-full max-w-sm bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#2C1A14] p-5 space-y-4">
                <h3 className="font-display font-black uppercase text-xl text-[#2C1A14]">Alterar Senha</h3>
                <p className="font-sans text-sm font-bold opacity-70">Para: {selectedUser?.email}</p>
                <div>
                  <label className="block font-sans font-bold text-xs uppercase tracking-wider text-[#2C1A14] mb-1">Nova Senha</label>
                  <input type="password" required minLength="6" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-white border-2 border-[#2C1A14] px-3 py-2 font-sans font-bold outline-none focus:ring-4 focus:ring-[#EAB308]/30 transition-all" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowPasswordForm(false)} className="font-display font-bold uppercase text-xs px-4 py-2">Cancelar</button>
                  <ButtonPrimary type="submit" color="bgOlive">Atualizar</ButtonPrimary>
                </div>
              </form>
            </div>
          )}

          {deletingUser && (
            <ConfirmModal
              title="Excluir usuário?"
              confirmText="Excluir"
              cancelText="Cancelar"
              onConfirm={handleDelete}
              onCancel={() => setDeletingUser(null)}
              critical
            >
              <p>Tem certeza de que deseja excluir o usuário <strong>{deletingUser.email}</strong>?</p>
              <p className="mt-2 text-sm">O usuário perderá o acesso ao painel de configurações imediatamente.</p>
            </ConfirmModal>
          )}
        </div>
      )}
    </section>
  );
}
