import { useEffect, useState } from "react";
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
  UserPlus,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Client, ClientStatus, Contract } from "../types";
import { userService, UserResponse } from "../services/userService";
import { contractService, ContractResponse } from "../services/contractService";
import { authService } from "../services/authService";

const clientStatusConfig: Record<ClientStatus, { bg: string; text: string }> = {
  Active: { bg: "bg-[#052e1a]", text: "text-[#34d399]" },
  Inactive: { bg: "bg-[#1f2937]", text: "text-[#9ca3af]" },
  Pending: { bg: "bg-[#2d1f00]", text: "text-[#f59e0b]" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function ManageClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<UserResponse[]>([]);
  const [allContracts, setAllContracts] = useState<ContractResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewingClient, setViewingClient] = useState<UserResponse | null>(null);
  const [assigningClient, setAssigningClient] = useState<UserResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [users, contracts, user] = await Promise.all([
        userService.listUsers(),
        contractService.listContracts(),
        authService.getCurrentUser()
      ]);
      // Filter for clients only
      setClients(users.filter(u => u.role === 'client'));
      setAllContracts(contracts);
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const filteredClients = clients.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const getClientContractsCount = (clientId: string) => {
    return allContracts.filter(c => c.client_id === clientId).length;
  };

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
            <h1 className="text-sm text-[#94a3b8] font-normal">Manage Clients</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#1a2540] border border-[#2a3a5c] flex items-center justify-center text-[#60a5fa] text-xs">
              PL
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[#4b5563] hover:text-[#94a3b8] transition-colors text-xs"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[#e2e8f0]">Manage Clients</h2>
            <p className="text-[#4b5563] text-sm mt-1">
              Assign contracts and view client contract responsibilities.
            </p>
          </div>
        </div>

        {/* Clients Table Container */}
        <div className="bg-[#0d1521] border border-[#1e2d45] rounded-2xl overflow-hidden shadow-xl shadow-black/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-[#1e2d45]">
            <h3 className="text-[#e2e8f0] text-lg font-medium">Assigned Clients</h3>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563]" />
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#111827] border border-[#1e2d45] rounded-lg pl-9 pr-4 py-2 text-sm text-[#e2e8f0] placeholder-[#374151] focus:outline-none focus:border-[#3b82f6] transition-colors"
              />
            </div>
          </div>

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
                {filteredClients.map((client, idx) => {
                  const status: ClientStatus = client.is_active ? "Active" : "Inactive";
                  const sc = clientStatusConfig[status];
                  return (
                    <tr
                      key={client.id}
                      className={`hover:bg-[#111827] transition-colors ${idx % 2 === 0 ? "" : "bg-[#0b1220]/20"}`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1a2540] flex items-center justify-center text-[#60a5fa] text-xs font-semibold shrink-0">
                            {client.full_name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className="text-[#e2e8f0] text-sm font-medium">{client.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-[#64748b] text-sm">{client.email}</td>
                      <td className="px-6 py-5">
                        <span className="text-[#e2e8f0] text-sm">{getClientContractsCount(client.id)}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide ${sc.bg} ${sc.text}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <ActionBtn
                            icon={<Eye size={14} />}
                            label="View"
                            onClick={() => setViewingClient(client)}
                          />
                          <ActionBtn
                            icon={<Edit2 size={14} />}
                            label="Assign Contract"
                            onClick={() => setAssigningClient(client)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-[#4b5563] text-sm">
                      No clients found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ── Modals ── */}
      <AnimatePresence>
        {viewingClient && (
          <ViewContractsModal
            client={viewingClient}
            allContracts={allContracts}
            onClose={() => setViewingClient(null)}
          />
        )}
        {assigningClient && (
          <AssignContractModal
            client={assigningClient}
            onClose={() => setAssigningClient(null)}
            onSave={() => {
              fetchData();
              setAssigningClient(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionBtn({
  icon,
  label,
  className = "",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
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

function ViewContractsModal({ client, allContracts, onClose }: { client: UserResponse; allContracts: ContractResponse[]; onClose: () => void }) {
  const clientContracts = allContracts.filter(c => c.client_id === client.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-[#0d1521] border border-[#1e2d45] rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-[#1e2d45] flex items-center justify-between bg-[#0b1220]">
          <div>
            <h3 className="text-lg font-medium text-[#e2e8f0]">{client.full_name}'s Contracts</h3>
            <p className="text-[#4b5563] text-xs mt-0.5">{clientContracts.length} assigned contracts</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#1a2540] rounded-lg text-[#4b5563] transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {clientContracts.map(c => (
            <div key={c.id} className="p-4 bg-[#111827] border border-[#1e2d45] rounded-xl flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/10 rounded-lg text-blue-400">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#e2e8f0]">{c.title || c.filename}</p>
                  <p className="text-[10px] text-[#4b5563] font-mono">{c.id}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] bg-[#1a2540] text-[#94a3b8] px-2 py-0.5 rounded border border-[#2a3a5c]">
                  {c.contract_type || "Legal Doc"}
                </span>
                <p className="text-[10px] text-[#374151] mt-1">{new Date(c.uploaded_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {clientContracts.length === 0 && (
            <div className="py-12 text-center text-[#4b5563] text-sm">No contracts found for this client.</div>
          )}
        </div>
        <div className="p-4 border-t border-[#1e2d45] bg-[#0b1220] flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[#1a2540] text-sm text-[#94a3b8] rounded-lg hover:bg-[#1e2d45] transition-colors border border-[#2a3a5c]">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AssignContractModal({ client, onClose, onSave }: { client: UserResponse; onClose: () => void; onSave: () => void }) {
  const [newContractId, setNewContractId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAssign = async () => {
    if (!newContractId.trim()) return;
    setLoading(true);
    setError("");
    try {
      await contractService.assignContract(newContractId, client.id);
      onSave();
    } catch (err: any) {
      setError(err.message || "Failed to assign contract. Please check the Contract ID.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative bg-[#0d1521] border border-[#1e2d45] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-[#1e2d45] flex items-center justify-between bg-[#0b1220]">
          <h3 className="text-lg font-medium text-[#e2e8f0]">Assign Contract</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-[#1a2540] rounded-lg text-[#4b5563] transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-blue-600/5 border border-blue-500/10 rounded-xl">
            <p className="text-xs text-[#60a5fa] font-medium uppercase tracking-wider mb-1">Target Client</p>
            <p className="text-sm text-[#e2e8f0] font-semibold">{client.full_name}</p>
            <p className="text-xs text-[#4b5563]">{client.email}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#4b5563] uppercase tracking-wider">Contract ID</label>
            <input
              required
              type="text"
              value={newContractId}
              onChange={(e) => setNewContractId(e.target.value)}
              className="w-full bg-[#111827] border border-[#1e2d45] rounded-lg px-4 py-2.5 text-sm font-mono text-[#e2e8f0] focus:border-[#3b82f6] outline-none transition-colors"
              placeholder="e.g. c-xyz-123"
            />
          </div>
          {error && <p className="text-xs text-red-400 bg-red-400/5 p-2 rounded border border-red-400/10">{error}</p>}
          <div className="pt-2">
            <button
              onClick={handleAssign}
              disabled={loading || !newContractId.trim()}
              className="w-full py-3 bg-[#1a3a7a] text-[#93c5fd] rounded-lg text-sm font-medium hover:bg-[#1e4590] transition-colors shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Assigning..." : "Assign Contract"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
