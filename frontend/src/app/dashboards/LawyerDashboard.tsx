import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  FileText,
  Download,
  CheckCircle,
  Upload,
  Users,
  LogOut,
  Scale,
  ChevronDown,
  X,
  Search,
  Filter,
  UserPlus,
  Briefcase,
} from "lucide-react";
import { SharedHeader } from "../components/SharedHeader";
import { Footer } from "../components/Footer";
import { authService } from "../services/authService";
import { contractService, ContractResponse } from "../services/contractService";

// ─── Types ───────────────────────────────────────────────────────────────────

type ContractStatus =
  | "Uploaded"
  | "Under Review"
  | "Analyzed"
  | "Summary Ready"
  | "Approved"
  | "Requires Revision"
  | "uploaded"
  | "processing"
  | "analyzed"
  | "reviewed"
  | "approved"
  | "completed";

type ContractType = "NDA" | "Service" | "Employment" | "Partnership" | "Lease" | string;

interface Contract extends ContractResponse {
  client: string;
  paralegal: string;
}

const mockClients: any[] = [
  { id: "cl1", name: "Apex Corporation", email: "legal@apexcorp.com", contracts: 2, joined: "2025-09-01" },
  { id: "cl2", name: "BlueWave Solutions", email: "admin@bluewave.io", contracts: 1, joined: "2025-11-12" },
];

const mockParalegals: any[] = [
  { id: "p1", name: "Sarah Mitchell", email: "s.mitchell@contractai.com", assigned: 3, specialization: "Corporate" },
];

const TYPE_COLORS: Record<string, string> = {
  NDA: "bg-purple-500/15 text-purple-300 border border-purple-500/25",
  Service: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/25",
  Employment: "bg-orange-500/15 text-orange-300 border border-orange-500/25",
  Partnership: "bg-pink-500/15 text-pink-300 border border-pink-500/25",
  Lease: "bg-teal-500/15 text-teal-300 border border-teal-500/25",
};

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; badge: string; text: string }
> = {
  analysed: {
    label: "Analysed",
    dot: "bg-blue-400",
    badge: "bg-blue-500/20 border border-blue-500/30",
    text: "text-blue-300",
  },
  accepted: {
    label: "Accepted",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/20 border border-emerald-500/30",
    text: "text-emerald-300",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-red-400",
    badge: "bg-red-500/20 border border-red-500/30",
    text: "text-red-300",
  },
  // Transitional/Legacy mappings
  uploaded: { label: "Uploaded", dot: "bg-slate-400", badge: "bg-slate-500/20 border border-slate-500/30", text: "text-slate-300" },
  Uploaded: { label: "Uploaded", dot: "bg-slate-400", badge: "bg-slate-500/20 border border-slate-500/30", text: "text-slate-300" },
  analyzed: { label: "Analysed", dot: "bg-blue-400", badge: "bg-blue-500/20 border border-blue-500/30", text: "text-blue-300" },
  Analyzed: { label: "Analysed", dot: "bg-blue-400", badge: "bg-blue-500/20 border border-blue-500/30", text: "text-blue-300" },
  approved: { label: "Accepted", dot: "bg-emerald-500", badge: "bg-emerald-500/20 border border-emerald-500/30", text: "text-emerald-300" },
  Approved: { label: "Accepted", dot: "bg-emerald-500", badge: "bg-emerald-500/20 border border-emerald-500/30", text: "text-emerald-300" },
  "Requires Revision": { label: "Rejected", dot: "bg-red-400", badge: "bg-red-500/20 border border-red-500/30", text: "text-red-300" },
  "Summary Ready": { label: "Analysed", dot: "bg-blue-400", badge: "bg-blue-500/20 border border-blue-500/30", text: "text-blue-300" },
};

const ALL_STATUSES = [
  "analysed",
  "accepted",
  "rejected",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({
  status,
  contractId,
  onChangeStatus,
}: {
  status: string;
  contractId: string;
  onChangeStatus: (id: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Uploaded"];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer transition-opacity hover:opacity-80 select-none ${cfg.badge} ${cfg.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
        {cfg.label}
        <ChevronDown size={10} className="ml-0.5 opacity-70" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1.5 w-44 rounded-xl border border-[#2a3a52] bg-[#0f1e33] shadow-2xl overflow-hidden">
          {ALL_STATUSES.map((s) => {
            const c = STATUS_CONFIG[s] || STATUS_CONFIG["Uploaded"];
            return (
              <button
                key={s}
                onClick={() => {
                  onChangeStatus(contractId, s);
                  setOpen(false);
                }}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/5 ${s === status ? "bg-white/5" : ""
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
                <span className={c.text}>{c.label}</span>
                {s === status && (
                  <CheckCircle size={10} className="ml-auto text-blue-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-[#1e2d42] bg-[#0b1829] p-5 flex flex-col gap-1">
      <p className="text-xs text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`text-2xl ${accent}`}>{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}

// ─── Manage Modal ─────────────────────────────────────────────────────────────

function ManageModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"clients" | "paralegals">("clients");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[#1e2d42] bg-[#0b1829] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d42]">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-400" />
            <h2 className="text-white">Manage Clients & Paralegals</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1e2d42]">
          {(["clients", "paralegals"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm capitalize transition-colors relative ${tab === t
                ? "text-blue-400"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              {t}
              {tab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 max-h-96 overflow-y-auto scrollbar-thin">
          {tab === "clients" ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs text-slate-400">{mockClients.length} clients registered</p>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs hover:bg-blue-600/30 transition-colors">
                  <UserPlus size={12} />
                  Add Client
                </button>
              </div>
              {mockClients.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0f1e33] border border-[#1e2d42] hover:border-[#2a3a52] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600/25 border border-blue-500/30 flex items-center justify-center text-blue-300 text-xs shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm text-slate-200">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{c.contracts} contract{c.contracts !== 1 ? "s" : ""}</p>
                    <p className="text-xs text-slate-600">Joined {c.joined}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs text-slate-400">{mockParalegals.length} paralegals on team</p>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs hover:bg-blue-600/30 transition-colors">
                  <UserPlus size={12} />
                  Add Paralegal
                </button>
              </div>
              {mockParalegals.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0f1e33] border border-[#1e2d42] hover:border-[#2a3a52] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/25 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs shrink-0">
                      {p.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm text-slate-200">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                      {p.specialization}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">{p.assigned} assigned</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#1e2d42] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#0f1e33] border border-[#2a3a52] text-slate-300 text-sm hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#1e2d42] bg-[#0b1829] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d42]">
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-blue-400" />
            <h2 className="text-white">Upload Contract</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Contract Name</label>
            <input
              type="text"
              placeholder="e.g. Service Agreement — ClientName"
              className="w-full px-3 py-2 rounded-lg bg-[#0f1e33] border border-[#2a3a52] text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Client</label>
              <select className="w-full px-3 py-2 rounded-lg bg-[#0f1e33] border border-[#2a3a52] text-slate-200 text-sm focus:outline-none focus:border-blue-500/50">
                {mockClients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Paralegal</label>
              <select className="w-full px-3 py-2 rounded-lg bg-[#0f1e33] border border-[#2a3a52] text-slate-200 text-sm focus:outline-none focus:border-blue-500/50">
                {mockParalegals.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Contract Type</label>
            <select className="w-full px-3 py-2 rounded-lg bg-[#0f1e33] border border-[#2a3a52] text-slate-200 text-sm focus:outline-none focus:border-blue-500/50">
              {(["NDA", "Service", "Employment", "Partnership", "Lease"] as ContractType[]).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">File</label>
            <div className="border-2 border-dashed border-[#2a3a52] rounded-xl p-6 text-center hover:border-blue-500/40 transition-colors cursor-pointer">
              <Upload size={20} className="text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Drop PDF / DOCX here or <span className="text-blue-400">browse</span></p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#1e2d42] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#0f1e33] border border-[#2a3a52] text-slate-300 text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function LawyerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, contractsData] = await Promise.all([
          authService.getCurrentUser() as Promise<any>,
          contractService.listContracts()
        ]);
        setUser({
          name: userData.full_name || userData.username || "Lawyer",
          role: userData.role,
          initials: (userData.full_name || userData.username || "L").substring(0, 2).toUpperCase()
        });

        // Transform backend contracts to include display names if missing
        const transformed: Contract[] = contractsData.map(c => ({
          ...c,
          client: c.client_name || "N/A",
          paralegal: c.paralegal_name || "N/A",
          lawyer: c.lawyer_name || "N/A"
        }));

        setContracts(transformed);
      } catch (error) {
        console.error("Failed to fetch Lawyer dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  async function handleStatusChange(id: string, status: string) {
    try {
      await contractService.updateStatus(id, status);
      setContracts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Status update failed");
    }
  }

  const filtered = contracts.filter((c) => {
    const matchSearch =
      search === "" ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.client.toLowerCase().includes(search.toLowerCase()) ||
      c.paralegal.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "All" || (c.contract_type || "").toUpperCase() === filterType.toUpperCase();
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    total: contracts.length,
    analysed: contracts.filter((c) => c.status === "analysed" || c.status === "Analyzed").length,
    accepted: contracts.filter((c) => c.status === "accepted" || c.status === "Approved").length,
    rejected: contracts.filter((c) => c.status === "rejected" || c.status === "Requires Revision").length,
  };

  return (
    <div className="min-h-screen bg-[#0f1729] text-white font-inter">
      <SharedHeader isLoggedIn={true} user={user} />

      {/* ── Page Body ── */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-white">Lawyer Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              Oversee contract reviews, update final status, and manage clients and paralegals.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/upload-contract?from=/lawyer-dashboard")}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600/50 text-slate-200 rounded-lg text-sm hover:bg-slate-600 transition-colors"
            >
              <Upload size={16} />
              Upload Contract
            </button>
            <button
              onClick={() => navigate("/manage-users-lawyer?from=/lawyer-dashboard")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-lg text-sm hover:bg-blue-600/30 transition-colors"
            >
              <Users size={16} />
              Manage Users
            </button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Contracts"
            value={stats.total}
            sub="All assigned contracts"
            accent="text-white"
          />
          <StatCard
            label="Analysed"
            value={stats.analysed}
            sub="AI Processing done"
            accent="text-blue-400"
          />
          <StatCard
            label="Accepted"
            value={stats.accepted}
            sub="Final approvals issued"
            accent="text-emerald-400"
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            sub="Revision required"
            accent="text-red-400"
          />
        </div>

        {/* ── Contracts Table Card ── */}
        <div className="rounded-2xl border border-[#1e2d42] bg-[#0b1829] overflow-hidden">

          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#1e2d42]">
            <div className="flex items-center gap-2">
              <Briefcase size={15} className="text-blue-400" />
              <h3 className="text-white">All Contracts</h3>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/25">
                {filtered.length}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search contracts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-[#0f1e33] border border-[#2a3a52] text-slate-300 text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 w-full sm:w-48"
                />
              </div>

              {/* Type filter */}
              <div className="relative">
                <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as ContractType | "All")}
                  className="pl-7 pr-3 py-1.5 rounded-lg bg-[#0f1e33] border border-[#2a3a52] text-slate-300 text-xs focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  {(["NDA", "Service", "Employment", "Partnership", "Lease"] as ContractType[]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div className="relative">
                <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as ContractStatus | "All")}
                  className="pl-7 pr-3 py-1.5 rounded-lg bg-[#0f1e33] border border-[#2a3a52] text-slate-300 text-xs focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table — scrollable */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#1a2a3f]">
                  {[
                    "Contract Name",
                    "Client Name",
                    "Paralegal",
                    "Upload Date",
                    "Type",
                    "Status",
                    "Actions",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500 font-medium whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                      No contracts match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((contract, idx) => (
                    <tr
                      key={contract.id}
                      className={`border-b border-[#111e2e] last:border-0 hover:bg-white/[0.02] transition-colors ${idx % 2 === 0 ? "" : "bg-white/[0.01]"
                        }`}
                    >
                      {/* Contract Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <FileText size={12} className="text-blue-400" />
                          </div>
                          <span className="text-sm text-slate-200 whitespace-nowrap">{contract.title}</span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 shrink-0">
                            {contract.client.charAt(0)}
                          </div>
                          <span className="text-sm text-slate-300 whitespace-nowrap">{contract.client}</span>
                        </div>
                      </td>

                      {/* Paralegal */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-700/30 border border-indigo-600/30 flex items-center justify-center text-[10px] text-indigo-300 shrink-0">
                            {contract.paralegal.substring(0, 1)}
                          </div>
                          <span className="text-sm text-slate-300 whitespace-nowrap">{contract.paralegal}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-sm text-slate-400 whitespace-nowrap">
                        {new Date(contract.uploaded_at).toLocaleDateString()}
                      </td>

                      {/* Type */}
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => navigate(`/result/${contract.id}`)}
                          className="hover:opacity-80 transition-opacity"
                        >
                          <span className={`px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-300`}>
                            {contract.contract_type || "Legal Document"}
                          </span>
                        </button>
                      </td>

                      {/* Status — editable */}
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          status={contract.status}
                          contractId={contract.id}
                          onChangeStatus={handleStatusChange}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            title="View"
                            onClick={() => navigate(`/view-contract/${contract.id}?from=/lawyer-dashboard`)}
                            className="p-1.5 rounded-lg bg-[#0f1e33] border border-[#2a3a52] text-slate-400 hover:text-blue-300 hover:border-blue-500/40 transition-colors"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            title="Summarize"
                            onClick={() => navigate(`/contract-summary/${contract.id}?from=/lawyer-dashboard`)}
                            className="p-1.5 rounded-lg bg-[#0f1e33] border border-[#2a3a52] text-slate-400 hover:text-purple-300 hover:border-purple-500/40 transition-colors"
                          >
                            <FileText size={13} />
                          </button>
                          <button
                            title="Download"
                            className="p-1.5 rounded-lg bg-[#0f1e33] border border-[#2a3a52] text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-colors"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-5 py-3 border-t border-[#111e2e] flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing <span className="text-slate-400">{filtered.length}</span> of{" "}
              <span className="text-slate-400">{contracts.length}</span> contracts
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className={`w-6 h-6 rounded text-xs transition-colors ${p === 1
                    ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                    : "text-slate-500 hover:text-slate-300"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}