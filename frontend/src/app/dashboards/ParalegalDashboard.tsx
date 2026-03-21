import { useState, useEffect } from "react";
import {
  Upload,
  Users,
  Eye,
  FileText,
  FileSearch,
  Download,
  LogOut,
  ChevronDown,
  FileCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Scale,
  Search
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { SharedHeader } from "../components/SharedHeader";
import { Footer } from "../components/Footer";
import { Contract, ContractStatus } from "../types";
import { authService } from "../services/authService";
import { contractService, ContractResponse } from "../services/contractService";


// ─── Status Config ─────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  analysed: {
    bg: "bg-[#0f2540]",
    text: "text-[#60a5fa]",
    dot: "bg-[#3b82f6]",
    label: "Analysed",
  },
  accepted: {
    bg: "bg-[#052e1a]",
    text: "text-[#34d399]",
    dot: "bg-[#10b981]",
    label: "Accepted",
  },
  rejected: {
    bg: "bg-[#2d0a0a]",
    text: "text-[#f87171]",
    dot: "bg-[#ef4444]",
    label: "Rejected",
  },
  // Transitional
  uploaded: { bg: "bg-[#1f2937]", text: "text-[#9ca3af]", dot: "bg-[#6b7280]", label: "Uploaded" },
  Uploaded: { bg: "bg-[#1f2937]", text: "text-[#9ca3af]", dot: "bg-[#6b7280]", label: "Uploaded" },
  analyzed: { bg: "bg-[#0f2540]", text: "text-[#60a5fa]", dot: "bg-[#3b82f6]", label: "Analysed" },
  Analyzed: { bg: "bg-[#0f2540]", text: "text-[#60a5fa]", dot: "bg-[#3b82f6]", label: "Analysed" },
};

const CONTRACT_STATUSES = [
  "analysed",
  "accepted",
  "rejected",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDropdown({
  status,
  onChange,
}: {
  status: string;
  onChange: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig[status];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer transition-opacity hover:opacity-80 ${cfg.bg} ${cfg.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
        <ChevronDown size={10} className="opacity-60" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-20 bg-[#111827] border border-[#1e2d45] rounded-lg shadow-xl overflow-hidden min-w-[160px]">
            {CONTRACT_STATUSES.map((s) => {
              const c = statusConfig[s];
              return (
                <button
                  key={s}
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-[#1a2540] ${s === status ? "bg-[#1a2540]" : ""
                    } ${c.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-[#111827] border border-[#1e2d45] rounded-xl p-4 flex items-center gap-4 shadow-sm">
      <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-[#4b5563] text-xs font-medium">{label}</p>
        <p className="text-[#e2e8f0] text-xl mt-0.5 font-semibold">{value}</p>
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a2540] border border-[#2a3a5c] text-[#94a3b8] rounded-lg text-xs hover:bg-[#1e2d45] hover:text-[#e2e8f0] transition-colors"
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function ParalegalDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, contractsData] = await Promise.all([
          authService.getCurrentUser() as Promise<any>,
          contractService.listContracts()
        ]);
        setUser({
          name: userData.full_name || userData.username || "Paralegal",
          role: userData.role,
          initials: (userData.full_name || userData.username || "P").substring(0, 2).toUpperCase()
        });
        setContracts(contractsData);
      } catch (error) {
        console.error("Failed to fetch Paralegal dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await contractService.updateStatus(id, status);
      setContracts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const filtered = contracts.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.client_id || "").toLowerCase().includes(search.toLowerCase()) ||
      c.filename.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const total = contracts.length;
  const analysed = contracts.filter(
    (c) => c.status === "analysed" || c.status === "analyzed"
  ).length;
  const accepted = contracts.filter(
    (c) => c.status === "accepted" || c.status === "approved"
  ).length;
  const rejected = contracts.filter(
    (c) => c.status === "rejected" || c.status === "Requires Revision"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1729] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1729] text-white font-inter">
      <SharedHeader isLoggedIn={true} user={user} />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#e2e8f0]">Paralegal Dashboard</h1>
            <p className="text-[#4b5563] text-sm mt-1 max-w-lg">
              Manage contract reviews, update statuses, and oversee assigned
              client contracts.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/manage-clients"
              className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-[#2a3a5c] text-[#94a3b8] rounded-lg text-sm font-medium hover:bg-[#1a2540] hover:text-[#e2e8f0] transition-colors shadow-sm"
            >
              <Users size={14} />
              Manage Clients
            </Link>
            <Button
              onClick={() => navigate("/upload-contract")}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a3a7a] border border-[#2a4a9a] text-[#93c5fd] rounded-lg text-sm font-medium hover:bg-[#1e4590] transition-colors shadow-lg shadow-blue-900/10"
            >
              <Upload size={14} />
              Upload Contract
            </Button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FileCheck size={16} className="text-[#94a3b8]" />}
            label="Total Assigned"
            value={total}
            color="bg-[#1a2540]"
          />
          <StatCard
            icon={<Clock size={16} className="text-[#60a5fa]" />}
            label="Analysed"
            value={analysed}
            color="bg-[#0f2540]"
          />
          <StatCard
            icon={<CheckCircle2 size={16} className="text-[#34d399]" />}
            label="Accepted"
            value={accepted}
            color="bg-[#052e1a]"
          />
          <StatCard
            icon={<AlertCircle size={16} className="text-[#f87171]" />}
            label="Rejected"
            value={rejected}
            color="bg-[#2d0a0a]"
          />
        </div>

        {/* ── Contracts Table ── */}
        <div className="bg-[#0d1521] border border-[#1e2d45] rounded-2xl overflow-hidden shadow-xl shadow-black/20">
          {/* Table Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#1e2d45]">
            <div>
              <h2 className="text-[#e2e8f0] text-lg font-medium">
                All Assigned Contracts
              </h2>
              <p className="text-[#4b5563] text-xs mt-0.5">
                {contracts.length} contracts total
              </p>
            </div>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563]"
              />
              <input
                type="text"
                placeholder="Search contracts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#111827] border border-[#1e2d45] rounded-lg pl-9 pr-4 py-2 text-sm text-[#e2e8f0] placeholder-[#374151] focus:outline-none focus:border-[#3b82f6] transition-colors w-full sm:w-64"
              />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#111827] bg-[#0b1220]/50">
                  {[
                    "Contract Name",
                    "Client Name",
                    "Upload Date",
                    "Contract Type",
                    "Status",
                    "Actions",
                  ].map((col) => (
                    <th
                      key={col}
                      className="text-left px-6 py-4 text-xs text-[#374151] font-semibold uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111827]">
                {filtered.map((contract) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-[#0b1220]/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#1a2540] flex items-center justify-center text-[#60a5fa]">
                          <FileText size={14} />
                        </div>
                        <span className="text-sm font-medium text-[#e2e8f0]">
                          {contract.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#94a3b8]">
                      {contract.client_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4b5563]">
                      {new Date(contract.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/result/${contract.id}`)}
                        className="hover:opacity-80 transition-opacity"
                      >
                        <span className="px-2.5 py-1 bg-[#1a2540] text-[#64748b] rounded-full text-[10px] font-medium border border-[#2a3a5c]">
                          {contract.contract_type || "Legal Document"}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <StatusDropdown
                        status={contract.status}
                        onChange={(s: string) => handleUpdateStatus(contract.id, s)}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ActionBtn
                          icon={<Eye size={14} />}
                          label="View"
                          onClick={() => navigate(`/view-contract/${contract.id}?from=/paralegal-dashboard`)}
                        />
                        <ActionBtn
                          icon={<FileSearch size={14} />}
                          label="Summarize"
                          onClick={() => navigate(`/contract-summary/${contract.id}?from=/paralegal-dashboard`)}
                        />
                        <ActionBtn
                          icon={<Download size={14} />}
                          label="Download"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-[#111827]">
            {filtered.map((contract) => (
              <div key={contract.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-md bg-[#1a2540] flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-[#60a5fa]" />
                    </div>
                    <div>
                      <p className="text-[#e2e8f0] text-sm font-medium">
                        {contract.title}
                      </p>
                      <p className="text-[#4b5563] text-xs">
                        {contract.client_id || "Direct Upload"}
                      </p>
                    </div>
                  </div>
                  <StatusDropdown
                    status={contract.status}
                    onChange={(s: string) => handleUpdateStatus(contract.id, s)}
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#1a2540] text-[#64748b] rounded-full text-[10px] font-medium">
                      {contract.filename.split('.').pop()?.toUpperCase()}
                    </span>
                    <span className="text-[#374151] text-[10px]">
                      {new Date(contract.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <ActionBtn icon={<Eye size={14} />} label="View" />
                    <ActionBtn
                      icon={<Download size={14} />}
                      label="Download"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
