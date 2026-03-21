import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Upload, Users, Eye, FileText, Download, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../components/ui/select";

import { SharedHeader } from "../components/SharedHeader";
import { Footer } from "../components/Footer";
import { authService } from "../services/authService";
import { contractService, ContractResponse } from "../services/contractService";
import { userService } from "../services/userService";

// Mock data types
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

interface Contract extends ContractResponse {
  clientName: string;
  paralegalName: string;
  lawyerName: string;
}



// Status badge styling
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "analysed":
    case "analyzed":
      return "bg-blue-600 text-blue-100";
    case "accepted":
    case "approved":
    case "completed":
      return "bg-green-600 text-green-100";
    case "rejected":
    case "requires revision":
      return "bg-red-600 text-red-100";
    default:
      return "bg-slate-600 text-slate-100";
  }
};

export function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const [userData, contractsData, usersData] = await Promise.all([
          authService.getCurrentUser().catch(e => { console.error(e); return null; }),
          contractService.listContracts().catch(e => { console.error(e); return []; }),
          userService.listUsers().catch(e => { console.error(e); return []; })
        ]);

        if (userData) {
          setUser({
            name: (userData as any).full_name || (userData as any).username || "Admin",
            role: (userData as any).role,
            initials: ((userData as any).full_name || (userData as any).username || "A").substring(0, 2).toUpperCase()
          });
        }

        if (contractsData) {
          setContracts(contractsData.map((c: any) => ({
            ...c,
            clientName: c.client_name || "N/A",
            paralegalName: c.paralegal_name || "N/A",
            lawyerName: c.lawyer_name || "N/A"
          })));
        }

        if (usersData) {
          setAllUsers(usersData);
        }



      } catch (error) {
        console.error("Failed to fetch Admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Helper for internal /users call since it's not in contractService
  async function apiFetch(endpoint: string, options: any = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: options.data ? JSON.stringify(options.data) : undefined
    });
    return response.json();
  }

  const handleStatusChange = async (contractId: string, newStatus: string) => {
    try {
      await contractService.updateStatus(contractId, newStatus);
      setContracts(prev =>
        prev.map(contract =>
          contract.id === contractId ? { ...contract, status: newStatus } : contract
        )
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1729] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate statistics
  const totalContracts = contracts.length;
  const activeClients = new Set(contracts.map(c => c.clientName)).size;
  const activeParalegals = new Set(contracts.map(c => c.paralegalName)).size;
  const activeLawyers = new Set(contracts.map(c => c.lawyerName)).size;


  return (
    <div className="min-h-screen bg-[#0f1729] text-white font-inter">
      <SharedHeader isLoggedIn={true} user={user} />


      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">
              Oversee system activity, manage users, and control contract workflows.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/upload-contract?from=/admin-dashboard")}
              className="bg-slate-700 text-slate-100 hover:bg-slate-600"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Contract
            </Button>
            <Button
              onClick={() => navigate("/manage-users?from=/admin-dashboard")}
              className="bg-blue-700 text-blue-100 hover:bg-blue-600"
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-700 bg-[#1a2332]">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400">Total Contracts</div>
              <div className="mt-2 text-3xl text-white">{totalContracts}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-[#1a2332]">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400">Active Clients</div>
              <div className="mt-2 text-3xl text-white">{activeClients}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-[#1a2332]">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400">Active Paralegals</div>
              <div className="mt-2 text-3xl text-white">{activeParalegals}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-[#1a2332]">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400">Active Lawyers</div>
              <div className="mt-2 text-3xl text-white">{activeLawyers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Contracts Table */}
        <div className="rounded-lg border border-slate-700 bg-[#1a2332]">
          <div className="border-b border-slate-700 px-6 py-4">
            <h3 className="text-xl text-white">All Contracts</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-700 bg-[#0f1729]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-slate-400">Contract Name</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-400">Client Name</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-400">Paralegal Name</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-400">Lawyer Name</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-400">Upload Date</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-400">Contract Type</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id} className="border-b border-slate-700 hover:bg-[#0f1729]">
                    <td className="px-6 py-4 text-sm text-slate-200">{contract.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{contract.clientName}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{contract.paralegalName}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{contract.lawyerName}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {new Date(contract.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      <button
                        onClick={() => navigate(`/result/${contract.id}`)}
                        className="hover:text-blue-400 hover:underline transition-colors text-left font-medium"
                      >
                        {contract.contract_type || "Legal Document"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="group flex items-center gap-1.5">
                        <Badge className={getStatusColor(contract.status)}>
                          {contract.status}
                        </Badge>
                        <Select
                          value={contract.status}
                          onValueChange={(value) => handleStatusChange(contract.id, value)}
                        >
                          <SelectTrigger className="h-6 w-6 border-0 bg-transparent p-0 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-70 group-hover:hover:opacity-100 focus:opacity-100">
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                          </SelectTrigger>
                          <SelectContent className="border-slate-600 bg-[#1a2332]">
                            <SelectItem value="analysed" className="text-slate-200">
                              Analysed
                            </SelectItem>
                            <SelectItem value="accepted" className="text-slate-200">
                              Accepted
                            </SelectItem>
                            <SelectItem value="rejected" className="text-slate-200">
                              Rejected
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                          onClick={() => navigate(`/view-contract/${contract.id}?from=/admin-dashboard`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                          onClick={() => navigate(`/contract-summary/${contract.id}?from=/admin-dashboard`)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role-based Users Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {['client', 'paralegal', 'lawyer'].map(role => {
            const roleUsers = allUsers.filter(u => u.role === role);

            return (
              <div key={role} className="rounded-lg border border-slate-700 bg-[#1a2332]">
                <div className="border-b border-slate-700 px-6 py-4">
                  <h3 className="text-xl text-white capitalize">{role}s</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-700 bg-[#0f1729]">
                      <tr>
                        <th className="px-6 py-3 text-left text-slate-400 font-medium">Name</th>
                        <th className="px-6 py-3 text-left text-slate-400 font-medium text-right font-medium pr-10">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roleUsers.length > 0 ? (
                        roleUsers.map((u) => (
                          <tr key={u.id} className="border-b border-slate-700/50 hover:bg-[#0f1729]/50 transition-colors">
                            <td className="px-6 py-4 text-slate-200 font-medium">{u.full_name}</td>
                            <td className="px-6 py-4 text-right pr-10">
                              <Badge className={u.is_active ? "bg-green-600" : "bg-red-600"}>
                                {u.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="px-6 py-8 text-center text-slate-500 italic">No {role}s found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div >
  );
}