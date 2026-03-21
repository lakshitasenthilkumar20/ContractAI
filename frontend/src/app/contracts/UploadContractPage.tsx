import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Upload, LogOut, Shield, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Card, CardContent } from "../components/ui/card";
import { authService } from "../services/authService";
import { userService } from "../services/userService";
import { contractService } from "../services/contractService";

export function UploadContractPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = new URLSearchParams(window.location.search);
  const fromPath = location.get('from') || "/";

  const [user, setUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    contractName: "",
    clientEmail: "",
    paralegalEmail: "",
    lawyerEmail: "",
    clientId: "",
    paralegalId: "",
    lawyerId: "",
  });

  const [cascadingMode, setCascadingMode] = useState<"none" | "client" | "paralegal" | "lawyer">("none");
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [filteredParalegals, setFilteredParalegals] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, users] = await Promise.all([
          authService.getCurrentUser() as Promise<any>,
          userService.listUsers()
        ]);
        setUser({
          name: userData.full_name || userData.username || "User",
          role: userData.role,
          initials: (userData.full_name || userData.username || "U").substring(0, 2).toUpperCase()
        });
        setAllUsers(users);

        // Auto-fill client details if the user IS a client
        if (userData.role === 'client') {
          const lawyer = users.find(u => u.id === userData.assigned_lawyer_id);
          const paralegal = users.find(u => u.id === userData.assigned_paralegal_id);

          setFormData(prev => ({
            ...prev,
            clientId: userData.id || userData._id,
            clientEmail: userData.email,
            lawyerId: userData.assigned_lawyer_id || "",
            lawyerEmail: lawyer?.email || "",
            paralegalId: userData.assigned_paralegal_id || "",
            paralegalEmail: paralegal?.email || ""
          }));
        }
      } catch (e) {
        console.error("Failed to fetch data:", e);
      }
    };
    fetchData();
  }, []);

  // Effect to handle cascading logic based on email inputs
  useEffect(() => {
    const trimmedClient = formData.clientEmail.trim().toLowerCase();
    const trimmedParalegal = formData.paralegalEmail.trim().toLowerCase();
    const trimmedLawyer = formData.lawyerEmail.trim().toLowerCase();

    // Priority 1: Client Email Match
    const client = allUsers.find(u => u.role?.toLowerCase() === 'client' && u.email?.toLowerCase() === trimmedClient);
    if (client) {
      if (cascadingMode !== "client" || formData.clientId !== client.id) {
        const p = allUsers.find(u => u.id === client.assigned_paralegal_id);
        const l = allUsers.find(u => u.id === client.assigned_lawyer_id);
        setCascadingMode("client");
        setFormData(prev => ({
          ...prev,
          clientId: client.id,
          paralegalId: client.assigned_paralegal_id || "",
          lawyerId: client.assigned_lawyer_id || "",
          paralegalEmail: p?.email || prev.paralegalEmail,
          lawyerEmail: l?.email || prev.lawyerEmail
        }));
      }
      return;
    }

    // Priority 2: Paralegal Email Match
    const paralegal = allUsers.find(u => u.role?.toLowerCase() === 'paralegal' && u.email?.toLowerCase() === trimmedParalegal);
    if (paralegal) {
      if (cascadingMode !== "paralegal" || formData.paralegalId !== paralegal.id) {
        const lawyer = allUsers.find(u => u.id === paralegal.assigned_lawyer_id);
        const associatedClients = allUsers.filter(u => u.role?.toLowerCase() === 'client' && u.assigned_paralegal_id === paralegal.id);

        setFilteredClients(associatedClients);
        setCascadingMode("paralegal");
        setFormData(prev => ({
          ...prev,
          paralegalId: paralegal.id,
          lawyerId: paralegal.assigned_lawyer_id || "",
          lawyerEmail: lawyer?.email || prev.lawyerEmail,
          clientId: "",
          // Don't clear clientEmail here to allow user to continue typing if it wasn't a match
        }));
      }
      return;
    }

    // Priority 3: Lawyer Email Match
    const lawyer = allUsers.find(u => (u.role?.toLowerCase() === 'lawyer' || u.role?.toLowerCase() === 'admin') && u.email?.toLowerCase() === trimmedLawyer);
    if (lawyer) {
      if (cascadingMode !== "lawyer" || formData.lawyerId !== lawyer.id) {
        const associatedParalegals = allUsers.filter(u => u.role?.toLowerCase() === 'paralegal' && u.assigned_lawyer_id === lawyer.id);
        const associatedClients = allUsers.filter(u => u.role?.toLowerCase() === 'client' && u.assigned_lawyer_id === lawyer.id);

        setFilteredParalegals(associatedParalegals);
        setFilteredClients(associatedClients);
        setCascadingMode("lawyer");
        setFormData(prev => ({
          ...prev,
          lawyerId: lawyer.id,
          paralegalId: "",
          paralegalEmail: "",
          clientId: "",
          clientEmail: ""
        }));
      }
      return;
    }

    // If no exact match and we are in a mode, we might want to stay there unless the triggering email was cleared
    // But for now, let's revert to "none" if the current mode's input is cleared or doesn't match
    if (cascadingMode === "client" && !trimmedClient) setCascadingMode("none");
    if (cascadingMode === "paralegal" && !trimmedParalegal) setCascadingMode("none");
    if (cascadingMode === "lawyer" && !trimmedLawyer) setCascadingMode("none");

  }, [formData.clientEmail, formData.paralegalEmail, formData.lawyerEmail, allUsers]);

  const handleClientChange = (email: string) => {
    setFormData(prev => ({ ...prev, clientEmail: email }));
  };

  const handleParalegalChange = (email: string) => {
    setFormData(prev => ({ ...prev, paralegalEmail: email }));
  };

  const handleLawyerChange = (email: string) => {
    setFormData(prev => ({ ...prev, lawyerEmail: email }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file first");
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('title', formData.contractName);
      data.append('client_id', formData.clientId);
      // Backend might need paralegal/lawyer IDs too if we want to bypass default assignments
      if (formData.paralegalId) data.append('paralegal_id', formData.paralegalId);
      if (formData.lawyerId) data.append('lawyer_id', formData.lawyerId);

      await contractService.uploadContract(data);
      alert("Contract uploaded and analyzed successfully!");
      navigate(fromPath);
    } catch (error: any) {
      console.error("Upload failed:", error);
      const detail = error.response?.data?.detail || error.message || "Unknown error";
      alert(`Upload/Analysis failed: ${detail}`);
    } finally {
      setUploading(false);
    }
  };

  const getDashboardPath = () => {
    if (fromPath !== "/") return fromPath;
    if (!user?.role) return "/";

    switch (user.role.toLowerCase()) {
      case "client": return "/client-dashboard";
      case "paralegal": return "/paralegal-dashboard";
      case "lawyer": return "/lawyer-dashboard";
      case "admin": return "/admin-dashboard";
      default: return "/dashboard";
    }
  };

  const handleBack = () => {
    navigate(getDashboardPath());
  };

  return (
    <div className="min-h-screen bg-[#0f1729]">
      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-700 bg-[#1a2332]">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-6">
              <button
                onClick={handleBack}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl text-white">Contract AI</span>
              </button>
              <div className="h-6 w-px bg-slate-700" />
              <h1 className="text-xl text-slate-200">Upload Contract</h1>
            </div>

            {/* Right: User Avatar and Logout */}
            <div className="flex items-center gap-4">
              <Avatar className="h-9 w-9 bg-slate-700">
                <AvatarFallback className="bg-slate-700 text-slate-200">{user?.initials || "U"}</AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-200"
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate('/login');
                }}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-[900px] px-6 py-8">
        {/* Back Button */}
        <Button
          onClick={handleBack}
          variant="ghost"
          className="mb-6 text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Header Section */}
        <div className="mb-8">
          <h2 className="mb-2 text-3xl text-white">Upload Contract</h2>
          <p className="text-slate-400">
            Upload a new contract and assign it to the appropriate team members.
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-slate-700 bg-[#1a2332]">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-slate-300">Contract Name</Label>
                <Input
                  required
                  value={formData.contractName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractName: e.target.value }))}
                  placeholder="Enter contract name"
                  className="mt-1 border-slate-600 bg-[#0f1729] text-slate-200"
                />
              </div>

              <div>
                <Label className="text-slate-300">Assign to Client</Label>
                {user?.role === "client" ? (
                  <Input
                    value={user?.name + " (You)"}
                    readOnly
                    className="mt-1 border-slate-600 bg-slate-800/50 text-slate-400 cursor-not-allowed"
                  />
                ) : cascadingMode === "paralegal" || cascadingMode === "lawyer" ? (
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => {
                      const c = allUsers.find(u => u.id === value);
                      setFormData(prev => ({ ...prev, clientId: value, clientEmail: c?.email || "" }));
                    }}
                  >
                    <SelectTrigger className="mt-1 border-slate-600 bg-[#0f1729] text-slate-200">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-600 bg-[#1a2332]">
                      {filteredClients.map(c => (
                        <SelectItem key={c.id} value={c.id} className="text-slate-200">{c.full_name} ({c.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={formData.clientEmail}
                    onChange={(e) => handleClientChange(e.target.value)}
                    placeholder="Enter client email"
                    list="clients-list"
                    className="mt-1 border-slate-600 bg-[#0f1729] text-slate-200"
                  />
                )}
              </div>

              <div>
                <Label className="text-slate-300">Assign to Paralegal</Label>
                {user?.role === "client" ? (
                  <Input
                    value={formData.paralegalEmail || "Auto-assigned to your staff"}
                    readOnly
                    className="mt-1 border-slate-600 bg-slate-800/50 text-slate-400 cursor-not-allowed"
                  />
                ) : cascadingMode === "lawyer" ? (
                  <Select
                    value={formData.paralegalId}
                    onValueChange={(value) => {
                      const p = allUsers.find(u => u.id === value);
                      setFormData(prev => ({ ...prev, paralegalId: value, paralegalEmail: p?.email || "", clientId: "", clientEmail: "" }));
                      // Further filter clients by this paralegal if in lawyer mode
                      const paralegalClients = allUsers.filter(u =>
                        u.role?.toLowerCase() === 'client' &&
                        u.assigned_lawyer_id === formData.lawyerId &&
                        u.assigned_paralegal_id === value
                      );
                      setFilteredClients(paralegalClients);
                    }}
                  >
                    <SelectTrigger className="mt-1 border-slate-600 bg-[#0f1729] text-slate-200">
                      <SelectValue placeholder="Select paralegal" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-600 bg-[#1a2332]">
                      <SelectItem value="none" className="text-slate-400">All Paralegals</SelectItem>
                      {filteredParalegals.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-slate-200">{p.full_name} ({p.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={formData.paralegalEmail}
                    onChange={(e) => handleParalegalChange(e.target.value)}
                    placeholder="Enter paralegal email"
                    list="paralegals-list"
                    className="mt-1 border-slate-600 bg-[#0f1729] text-slate-200"
                    disabled={cascadingMode === "client"}
                  />
                )}
              </div>

              <div>
                <Label className="text-slate-300">Assign to Lawyer</Label>
                {user?.role === "client" ? (
                  <Input
                    value={formData.lawyerEmail || "Auto-assigned to your staff"}
                    readOnly
                    className="mt-1 border-slate-600 bg-slate-800/50 text-slate-400 cursor-not-allowed"
                  />
                ) : (
                  <>
                    <Input
                      value={formData.lawyerEmail}
                      onChange={(e) => handleLawyerChange(e.target.value)}
                      placeholder="Enter lawyer email"
                      list="lawyers-list"
                      className="mt-1 border-slate-600 bg-[#0f1729] text-slate-200"
                      disabled={cascadingMode === "client" || cascadingMode === "paralegal"}
                    />
                    <datalist id="lawyers-list">
                      {allUsers.filter(u => u.role?.toLowerCase() === 'lawyer' || u.role?.toLowerCase() === 'admin').map(u => (
                        <option key={u.id} value={u.email}>{u.full_name}</option>
                      ))}
                    </datalist>
                  </>
                )}
              </div>

              {/* Added datalists for client and paralegal too for consistency when they are in Input mode */}
              <datalist id="clients-list">
                {allUsers.filter(u => u.role?.toLowerCase() === 'client').map(u => (
                  <option key={u.id} value={u.email}>{u.full_name}</option>
                ))}
              </datalist>
              <datalist id="paralegals-list">
                {allUsers.filter(u => u.role?.toLowerCase() === 'paralegal').map(u => (
                  <option key={u.id} value={u.email}>{u.full_name}</option>
                ))}
              </datalist>

              <div>
                <Label className="text-slate-300">Upload File</Label>
                <div
                  className="mt-1 rounded-lg border-2 border-dashed border-slate-600 bg-[#0f1729] p-12 cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-700">
                      <Upload className="h-8 w-8 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-300">
                        {file ? file.name : "Click to upload or drag and drop"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        PDF, DOC, DOCX (MAX. 10MB)
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      {file ? "Change File" : "Browse Files"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={uploading}
                  className="bg-blue-700 text-blue-100 hover:bg-blue-600 disabled:opacity-50"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload Contract"}
                </Button>
                <Button
                  type="button"
                  onClick={() => navigate(fromPath)}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
