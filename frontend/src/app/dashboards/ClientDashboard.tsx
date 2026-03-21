import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Eye, FileSearch, Download, FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import { SharedHeader } from "../components/SharedHeader";
import { Footer } from "../components/Footer";
import { authService } from "../services/authService";
import { contractService, ContractResponse } from "../services/contractService";

export function ClientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, contractsData] = await Promise.all([
          authService.getCurrentUser() as Promise<any>,
          contractService.listContracts()
        ]);
        setUser({
          name: userData.full_name || userData.username || "User",
          role: userData.role,
          initials: (userData.full_name || userData.username || "U").substring(0, 2).toUpperCase()
        });
        setContracts(contractsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "analysed":
      case "analyzed":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "accepted":
      case "approved":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2 tracking-tight">
            Client Dashboard
          </h1>
          <p className="text-slate-400">
            Manage and review your contracts with AI-powered summaries
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-slate-400">
            Upload a contract to generate an AI summary
          </p>
          <Button
            onClick={() => navigate("/upload-contract?from=/client-dashboard")}
            className="bg-slate-600 hover:bg-slate-500 text-white"
          >
            <Upload className="size-4 mr-2" />
            Upload Contract
          </Button>
        </div>

        {/* Contracts Table */}
        <div className="bg-[#1a2332] border border-slate-700 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg tracking-tight">
              My Contracts
            </h2>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-6 py-4 text-sm text-slate-400">Contract Name</th>
                  <th className="text-left px-6 py-4 text-sm text-slate-400">Upload Date</th>
                  <th className="text-left px-6 py-4 text-sm text-slate-400">Contract Type</th>
                  <th className="text-left px-6 py-4 text-sm text-slate-400">Status</th>
                  <th className="text-right px-6 py-4 text-sm text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id} className="border-b border-slate-700/50 hover:bg-slate-700/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="size-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-white">{contract.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(contract.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      <button
                        onClick={() => navigate(`/result/${contract.id}`)}
                        className="hover:text-blue-400 hover:underline transition-colors text-left"
                      >
                        {contract.contract_type || "Legal Document"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${getStatusBadge(contract.status)}`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/view-contract/${contract.id}?from=/client-dashboard`)}
                          className="text-slate-400 hover:text-white text-xs"
                          title="View"
                        >
                          <Eye className="size-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/contract-summary/${contract.id}?from=/client-dashboard`)}
                          className="text-slate-400 hover:text-white text-xs"
                          title="Summarize"
                        >
                          <FileSearch className="size-4 mr-1" />
                          Summarize
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-white text-xs"
                          title="Download"
                        >
                          <Download className="size-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-700/50">
            {contracts.map((contract) => (
              <div key={contract.id} className="p-4 hover:bg-slate-700/10 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <FileText className="size-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm text-white mb-1">{contract.title}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      <span>{new Date(contract.uploaded_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{contract.filename.split('.').pop()?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${getStatusBadge(contract.status)}`}>
                    {contract.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/view-contract/${contract.id}?from=/client-dashboard`)}
                    className="bg-slate-700/30 border-slate-600 hover:bg-slate-600/40 text-white text-xs flex-1"
                  >
                    <Eye className="size-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/contract-summary/${contract.id}?from=/client-dashboard`)}
                    className="bg-slate-700/30 border-slate-600 hover:bg-slate-600/40 text-white text-xs flex-1"
                  >
                    <FileSearch className="size-3 mr-1" />
                    Summarize
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-slate-700/30 border-slate-600 hover:bg-slate-600/40 text-white text-xs"
                  >
                    <Download className="size-3" />
                  </Button>
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