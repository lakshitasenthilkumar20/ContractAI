import { useState } from "react";
import {
  Users,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Search,
  Scale,
  LogOut,
  X,
  FileText,
  ChevronRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Client, ClientStatus, Contract, Paralegal } from "../types";
import { userService, UserResponse } from "../services/userService";
import { authService } from "../services/authService";
import { contractService, ContractResponse } from "../services/contractService";
import { useEffect } from "react";

const statusConfig: Record<ClientStatus, { bg: string; text: string }> = {
  Active: { bg: "bg-[#052e1a]", text: "text-[#34d399]" },
  Inactive: { bg: "bg-[#2d0a0a]", text: "text-[#f87171]" },
  Pending: { bg: "bg-[#2d1f00]", text: "text-[#f59e0b]" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function ManageUsersLawyer() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [paralegals, setParalegals] = useState<Paralegal[]>([]);
  const [allContracts, setAllContracts] = useState<ContractResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modals state
  const [assigningUser, setAssigningUser] = useState<Client | Paralegal | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [viewingParalegal, setViewingParalegal] = useState<Paralegal | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [users, me, contracts] = await Promise.all([
        userService.listUsers(),
        authService.getCurrentUser(),
        contractService.listContracts()
      ]);

      setCurrentUser(me);
      setAllContracts(contracts);

      const mappedClients: Client[] = users
        .filter(u => u.role === 'client')
        .map(u => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          status: u.is_active ? 'Active' : 'Inactive' as ClientStatus,
          contractsAssigned: contracts.filter(c => c.client_id === u.id).length
        }));

      const mappedParalegals: Paralegal[] = users
        .filter(u => u.role === 'paralegal')
        .map(u => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          status: u.is_active ? 'Active' : 'Inactive' as ClientStatus,
          contractsAssigned: contracts.filter(c => c.paralegal_id === u.id).length
        }));

      setClients(mappedClients);
      setParalegals(mappedParalegals);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d18] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d18] text-[#e2e8f0]">
      {/* ── Top Navigation ── */}
      <nav className="bg-[#0d1521] border-b border-[#1e2d45] sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="p-1.5 bg-[#1a2d5a] rounded-lg">
                <Scale size={16} className="text-[#60a5fa]" />
              </div>
              <span className="text-[#e2e8f0] text-sm tracking-wide font-medium">
                Contract<span className="text-[#60a5fa]">AI</span>
              </span>
            </Link>
            <div className="w-px h-4 bg-[#1e2d45]" />
            <h1 className="text-sm text-[#94a3b8] font-normal">Manage Clients & Paralegals</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#1a2540] rounded-full border border-[#2a3a5c]">
              <ShieldCheck size={12} className="text-blue-400" />
              <span className="text-[10px] uppercase tracking-wider text-blue-100 font-semibold">Admin Mode</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#1a3a7a] border border-[#2a4a9a] flex items-center justify-center text-[#93c5fd] text-xs font-bold">
              LD
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[#4b5563] hover:text-[#94a3b8] transition-colors text-xs"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight text-[#e2e8f0]">Manage Clients & Paralegals</h2>
          <p className="text-[#4b5563] text-sm max-w-2xl">
            Oversee client accounts, manage paralegals, and control contract assignments across the entire firm.
          </p>
        </div>

        {/* SECTION 1: Clients */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Users size={20} className="text-[#60a5fa]" />
              <h3 className="text-xl font-semibold text-[#e2e8f0]">Clients</h3>
            </div>
          </div>

          <div className="bg-[#0d1521] border border-[#1e2d45] rounded-2xl overflow-hidden shadow-xl shadow-black/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#111827] bg-[#0b1220]/50">
                    {["Client Name", "Email", "Assigned Contracts", "Status", "Actions"].map((col) => (
                      <th key={col} className="text-left px-6 py-4 text-xs text-[#374151] font-semibold uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111827]">
                  {clients.map((client) => {
                    const sc = statusConfig[client.status];
                    return (
                      <tr key={client.id} className="hover:bg-[#111827] transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1a2540] flex items-center justify-center text-[#60a5fa] text-xs font-semibold shrink-0 border border-[#2a3a5c]">
                              {client.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <span className="text-[#e2e8f0] text-sm font-medium">{client.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[#64748b] text-sm">{client.email}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-[#374151]" />
                            <span className="text-[#e2e8f0] text-sm">{client.contractsAssigned}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${sc.bg} ${sc.text}`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <ActionBtn icon={<Eye size={14} />} label="View Contracts" onClick={() => setViewingClient(client)} />
                            <ActionBtn icon={<Edit2 size={14} />} label="Assign Contract" onClick={() => setAssigningUser(client)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 2: Paralegals */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={20} className="text-[#60a5fa]" />
              <h3 className="text-xl font-semibold text-[#e2e8f0]">Paralegals</h3>
            </div>
          </div>

          <div className="bg-[#0d1521] border border-[#1e2d45] rounded-2xl overflow-hidden shadow-xl shadow-black/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#111827] bg-[#0b1220]/50">
                    {["Paralegal Name", "Email", "Assigned Contracts", "Status", "Actions"].map((col) => (
                      <th key={col} className="text-left px-6 py-4 text-xs text-[#374151] font-semibold uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111827]">
                  {paralegals.map((paralegal) => {
                    const sc = statusConfig[paralegal.status];
                    return (
                      <tr key={paralegal.id} className="hover:bg-[#111827] transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1e2d45] flex items-center justify-center text-[#60a5fa] text-xs font-semibold shrink-0 border border-[#2a3a5c]">
                              {paralegal.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <span className="text-[#e2e8f0] text-sm font-medium">{paralegal.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[#64748b] text-sm">{paralegal.email}</td>
                        <td className="px-6 py-5 text-[#e2e8f0] text-sm">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-[#374151]" />
                            <span className="text-[#e2e8f0] text-sm">{paralegal.contractsAssigned}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${sc.bg} ${sc.text}`}>
                            {paralegal.status}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <ActionBtn icon={<Eye size={14} />} label="View Details" onClick={() => setViewingParalegal(paralegal)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* ── Modals ── */}
      <AnimatePresence>
        {assigningUser && (
          <AssignContractModal
            type={clients.some(c => c.id === assigningUser.id) ? 'client' : 'paralegal'}
            user={assigningUser}
            allContracts={allContracts}
            onClose={() => { setAssigningUser(null); }}
            onSave={() => {
              fetchAllData();
              setAssigningUser(null);
            }}
          />
        )}
        {viewingClient && (
          <ViewContractsModal
            client={viewingClient}
            contracts={allContracts.filter(c => c.client_id === viewingClient.id)}
            onClose={() => setViewingClient(null)}
          />
        )}
        {viewingParalegal && (
          <ViewParalegalDetailsModal
            paralegal={viewingParalegal}
            allUsers={clients.concat(paralegals as any)} // For name lookups if needed
            allContracts={allContracts}
            onClose={() => setViewingParalegal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function ActionBtn({ icon, label, className = "", onClick }: { icon: React.ReactNode; label: string; className?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2540] border border-[#2a3a5c] text-[#94a3b8] rounded-lg text-xs hover:bg-[#1e2d45] hover:text-[#e2e8f0] transition-all ${className}`}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function ViewContractsModal({ client, contracts, onClose }: { client: Client; contracts: ContractResponse[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-[#0d1521] border border-[#1e2d45] rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-[#1e2d45] flex items-center justify-between bg-[#0b1220]">
          <div>
            <h3 className="text-xl font-bold text-[#e2e8f0]">Assigned Contracts</h3>
            <p className="text-[#4b5563] text-xs mt-1">Viewing contracts for {client.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#1a2540] rounded-xl text-[#4b5563] transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
          {contracts.length > 0 ? (
            <div className="grid gap-4">
              {contracts.map(c => (
                <div key={c.id} className="p-4 bg-[#111827] border border-[#1e2d45] rounded-xl flex items-center justify-between group hover:border-[#3b82f6] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#1a2d5a] rounded-lg text-blue-400">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#e2e8f0]">{c.title}</h4>
                      <p className="text-[#4b5563] text-[10px] mt-0.5">{c.contract_type} • ID: {c.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest font-bold">
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center opacity-50">
              <div className="p-4 bg-[#111827] rounded-full border border-dashed border-[#1e2d45]">
                <FileText size={32} className="text-[#1e2d45]" />
              </div>
              <p className="text-sm text-[#4b5563]">No contracts assigned to this client yet.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ViewParalegalDetailsModal({ paralegal, allUsers, allContracts, onClose }: { paralegal: Paralegal; allUsers: any[]; allContracts: ContractResponse[]; onClose: () => void }) {
  // Filter contracts where this paralegal is involved
  const paralegalContracts = allContracts.filter(c => c.paralegal_id === paralegal.id);

  // Group these contracts by client_id
  const clientGroups: Record<string, { name: string; contracts: ContractResponse[] }> = {};

  paralegalContracts.forEach(c => {
    if (c.client_id) {
      if (!clientGroups[c.client_id]) {
        clientGroups[c.client_id] = {
          name: c.client_name || allUsers.find(u => u.id === c.client_id)?.name || "Unknown Client",
          contracts: []
        };
      }
      clientGroups[c.client_id].contracts.push(c);
    }
  });

  const clientsWithContracts = Object.keys(clientGroups);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-[#0d1521] border border-[#1e2d45] rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-[#1e2d45] flex items-center justify-between bg-[#0b1220]">
          <div>
            <h3 className="text-xl font-bold text-[#e2e8f0]">Paralegal Portfolio</h3>
            <p className="text-[#4b5563] text-xs mt-1">Assigned clients and their active contracts for {paralegal.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#1a2540] rounded-xl text-[#4b5563] transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {clientsWithContracts.length > 0 ? (
            <div className="space-y-6">
              {clientsWithContracts.map(clientId => {
                const group = clientGroups[clientId];
                return (
                  <div key={clientId} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] text-xs font-bold border border-[#3b82f6]/20">
                        {group.name[0]}
                      </div>
                      <h4 className="text-sm font-bold text-[#e2e8f0] uppercase tracking-wider">{group.name}</h4>
                      <div className="h-px flex-1 bg-gradient-to-r from-[#1e2d45] to-transparent" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-11">
                      {group.contracts.map(c => (
                        <div key={c.id} className="p-3 bg-[#111827]/50 border border-[#1e2d45] rounded-xl flex items-center gap-3">
                          <FileText size={16} className="text-[#4b5563]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#f1f5f9] truncate">{c.title}</p>
                            <p className="text-[10px] text-[#4b5563]">{c.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center opacity-50">
              <div className="p-4 bg-[#111827] rounded-full border border-dashed border-[#1e2d45]">
                <Users size={32} className="text-[#1e2d45]" />
              </div>
              <p className="text-sm text-[#4b5563]">No assigned clients or contracts found.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function AssignContractModal({
  type,
  user,
  allContracts,
  onClose,
  onSave
}: {
  type: 'client' | 'paralegal';
  user: Client | Paralegal;
  allContracts: ContractResponse[];
  onClose: () => void;
  onSave: () => void
}) {
  const [assignedContracts, setAssignedContracts] = useState<ContractResponse[]>([]);
  const [newContractId, setNewContractId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const assigned = allContracts.filter(c =>
        (type === 'client' && c.client_id === user.id) ||
        (type === 'paralegal' && c.paralegal_id === user.id)
      );
      setAssignedContracts(assigned);
    }
  }, [user, allContracts, type]);

  const handleAssignContract = async () => {
    if (!newContractId.trim() || !user) return;
    setLoading(true);
    try {
      await contractService.assignContract(newContractId, user.id);
      setNewContractId("");
      setError("");
      onSave(); // Refresh parent
    } catch (err: any) {
      setError(err.message || "Failed to assign contract");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-[#0d1521] border border-[#1e2d45] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-[#1e2d45] flex items-center justify-between bg-[#0b1220]">
          <div>
            <h3 className="text-xl font-bold text-[#e2e8f0]">Assign New Contract</h3>
            <p className="text-[#4b5563] text-xs mt-1">Assign additional contract files to {user.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#1a2540] rounded-xl text-[#4b5563] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-bold text-[#e2e8f0] uppercase tracking-wider">New Assignment</h4>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#374151]" />
                  <input
                    type="text"
                    placeholder="Enter Contract ID (e.g. #772)"
                    value={newContractId}
                    onChange={(e) => setNewContractId(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e2d45] rounded-xl pl-11 pr-4 py-3 text-sm text-[#e2e8f0] focus:border-[#3b82f6] outline-none"
                  />
                </div>
                <button
                  disabled={loading}
                  onClick={handleAssignContract}
                  className="px-6 py-3 bg-[#1a3a7a] text-[#93c5fd] rounded-xl text-sm font-bold hover:bg-[#1e4590] transition-colors whitespace-nowrap border border-[#2a4a9a] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : "Assign Contract"}
                </button>
              </div>
              {error && <p className="text-red-400 text-[10px] font-medium animate-pulse ml-1">{error}</p>}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#e2e8f0] uppercase tracking-wider">Current Assignments</h4>
                <span className="text-[10px] text-[#4b5563] font-mono tracking-tighter">{assignedContracts.length} ITEMS</span>
              </div>
              <div className="border border-[#1e2d45] rounded-2xl overflow-hidden bg-[#0b1220]/30 shadow-inner">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#111827]/50 border-b border-[#1e2d45]">
                      <th className="px-6 py-3 text-[10px] text-[#374151] uppercase font-bold">ID</th>
                      <th className="px-6 py-3 text-[10px] text-[#374151] uppercase font-bold">Name</th>
                      <th className="px-6 py-3 text-[10px] text-[#374151] uppercase font-bold">Status</th>
                      <th className="px-6 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2d45]/50">
                    {assignedContracts.map((c) => (
                      <tr key={c.id} className="group hover:bg-[#1a2540]/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-[#60a5fa]">{c.id}</td>
                        <td className="px-6 py-4 text-xs text-[#e2e8f0] font-medium">{c.title}</td>
                        <td className="px-6 py-4">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ring-4 ring-emerald-500/10" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => alert("Removal not yet implemented.")}
                            className="p-1.5 text-[#374151] hover:text-red-400 transition-colors bg-transparent hover:bg-red-950/20 rounded-lg"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {assignedContracts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-xs text-[#4b5563]">No active assignments.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="p-8 border-t border-[#1e2d45] bg-[#0b1220] flex justify-end">
          <button onClick={onClose} className="px-10 py-3 bg-[#1a3a7a] text-[#93c5fd] rounded-xl text-sm font-bold hover:bg-[#1e4590] transition-all">
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
