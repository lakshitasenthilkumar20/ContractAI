import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, Download, Trash2, FileText, Upload } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { SharedHeader } from "../components/SharedHeader";
import { Footer } from "../components/Footer";

export function Dashboard() {
  const navigate = useNavigate();

  // Mock user for Header
  const mockUser = {
    name: "John Doe",
    role: "User",
    initials: "JD"
  };

  // Mock contract data
  const [contracts] = useState([
    {
      id: "1",
      name: "Service Agreement - Acme Corp.pdf",
      uploadDate: "2026-01-28",
      type: "Service Contract",
      status: "Analysed"
    },
    {
      id: "2",
      name: "Employment Contract - John Doe.pdf",
      uploadDate: "2026-01-25",
      type: "Employment Agreement",
      status: "Analysed"
    },
    {
      id: "3",
      name: "Vendor Agreement - Tech Solutions.pdf",
      uploadDate: "2026-01-20",
      type: "Vendor Agreement",
      status: "Pending"
    },
    {
      id: "4",
      name: "NDA - Partner Company.pdf",
      uploadDate: "2026-01-15",
      type: "NDA",
      status: "Closed"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Analysed": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "Closed": return "text-green-400 bg-green-400/10 border-green-400/20";
      case "Pending": return "text-slate-400 bg-slate-400/10 border-slate-400/20";
      default: return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1729] text-white font-inter">
      <SharedHeader isLoggedIn={true} user={mockUser} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1a2332] border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm mb-1">Total Contracts</div>
            <div className="text-3xl">24</div>
          </div>
          <div className="bg-[#1a2332] border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm mb-1">Analysed</div>
            <div className="text-3xl text-blue-400">18</div>
          </div>
          <div className="bg-[#1a2332] border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm mb-1">Pending</div>
            <div className="text-3xl text-slate-400">6</div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <Input
              placeholder="Search contracts..."
              className="pl-10 bg-[#1a2332] border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <Button
            variant="outline"
            className="bg-slate-700/30 border-slate-600 hover:bg-slate-600/40 text-white"
          >
            <Filter className="size-4 mr-2" />
            Filter
          </Button>
          <Button
            onClick={() => navigate("/upload-contract?from=/dashboard")}
            className="bg-slate-600 hover:bg-slate-500 text-white"
          >
            <Upload className="size-4 mr-2" />
            Upload Contract
          </Button>
        </div>

        {/* Contracts Table */}
        <div className="bg-[#1a2332] border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-6 py-4 text-sm text-slate-400">Contract Name</th>
                  <th className="text-left px-6 py-4 text-sm text-slate-400">Contract Type</th>
                  <th className="text-left px-6 py-4 text-sm text-slate-400">Upload Date</th>
                  <th className="text-left px-6 py-4 text-sm text-slate-400">Status</th>
                  <th className="text-right px-6 py-4 text-sm text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="size-5 text-slate-400" />
                        <span className="text-sm text-white">{contract.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {contract.type}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {contract.uploadDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${getStatusColor(contract.status)}`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/view-contract/${contract.id}?from=/dashboard`)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-white"
                        >
                          <Download className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}