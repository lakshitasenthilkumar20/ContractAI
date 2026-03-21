import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { LogOut, Shield, Edit, ToggleLeft, ToggleRight, FileText, Check, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { AddEditUserDialog } from "./AddEditUserDialog";
import { AssignContractDialog } from "./AssignContractDialog";
import { ApprovalAssignmentDialog } from "./ApprovalAssignmentDialog";
import { registrationService } from "../services/registrationService";
import { userService } from "../services/userService";
import { contractService } from "../services/contractService";

// Types for user management
type UserRole = "Client" | "Paralegal" | "Lawyer";
type UserStatus = "Active" | "Inactive" | "Suspended";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  assignedContracts: number;
  assignedLawyerName?: string;
  assignedParalegalName?: string;
}

const getStatusColor = (status: UserStatus) => {
  switch (status) {
    case "Active":
      return "bg-green-600 text-green-100 hover:bg-green-600";
    case "Inactive":
      return "bg-gray-600 text-gray-100 hover:bg-gray-600";
    case "Suspended":
      return "bg-red-600 text-red-100 hover:bg-red-600";
    default:
      return "bg-gray-600 text-gray-100 hover:bg-gray-600";
  }
};

export function ManageUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [assignContractDialogOpen, setAssignContractDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // States for Approval
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedPendingUser, setSelectedPendingUser] = useState<any | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState<any | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [uData, pData, cData] = await Promise.all([
        userService.listUsers(),
        registrationService.listRegistrations(),
        contractService.listContracts()
      ]);
      setUsers(uData.map((u: any) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
        status: u.is_active ? "Active" : "Inactive",
        assignedContracts: cData.filter((c: any) => c.client_id === u.id || c.paralegal_id === u.id || c.lawyer_id === u.id).length,
        assignedLawyerName: u.assigned_lawyer_id ? (uData.find((x: any) => x.id === u.assigned_lawyer_id)?.full_name || "Unassigned") : "Unassigned",
        assignedParalegalName: u.assigned_paralegal_id ? (uData.find((x: any) => x.id === u.assigned_paralegal_id)?.full_name || "Unassigned") : "Unassigned"
      })));
      setPendingUsers(pData.map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role,
        requestedRole: p.role.charAt(0).toUpperCase() + p.role.slice(1),
        requestDate: p.created_at,
        reason: p.message
      })));
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleApproveClick = (user: any) => {
    if (user.role === "lawyer") {
      confirmApproval(user.id, {});
    } else {
      setSelectedPendingUser(user);
      setApprovalDialogOpen(true);
    }
  };

  const confirmApproval = async (id: string, assignment: any) => {
    try {
      await registrationService.approveRegistration(id, assignment);
      fetchAllData();
    } catch (error) {
      console.error("Approval failed:", error);
      alert("Approval failed. Please check assignments.");
    }
  };

  const handleRejectUser = async (pendingUserId: string) => {
    if (window.confirm("Are you sure you want to reject this registration?")) {
      try {
        await registrationService.rejectRegistration(pendingUserId);
        fetchAllData();
      } catch (error) {
        console.error("Rejection failed:", error);
      }
    }
  };

  const handleShowDetails = (user: any) => {
    setDetailsUser(user);
    setViewDetailsOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setAddUserDialogOpen(true);
  };

  const handleAssignContract = (userId: string) => {
    setSelectedUserId(userId);
    setAssignContractDialogOpen(true);
  };

  const handleSaveUser = (userData: Partial<User>) => {
    setAddUserDialogOpen(false);
    setEditingUser(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const clients = users.filter(u => u.role === "Client");
  const paralegals = users.filter(u => u.role === "Paralegal");
  const lawyers = users.filter(u => u.role === "Lawyer");

  return (
    <div className="min-h-screen bg-[#0f1729]">
      <nav className="border-b border-slate-700 bg-[#1a2332]">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={() => navigate("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl text-white">Contract AI</span>
              </button>
              <div className="h-6 w-px bg-slate-700" />
              <h1 className="text-xl text-slate-200">Manage Users</h1>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="h-9 w-9 bg-slate-700">
                <AvatarFallback className="bg-slate-700 text-slate-200">AD</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl text-white">Manage Users</h2>
          <p className="text-slate-400">Oversee user accounts, manage roles, and approve new registrations.</p>
        </div>

        {/* Pending Approvals Section */}
        {pendingUsers.length > 0 && (
          <div className="mb-8">
            <Card className="border-amber-700/50 bg-[#1a2332]">
              <div className="border-b border-amber-700/50 bg-amber-950/20 px-6 py-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl text-white">Pending Approvals</h3>
                  <Badge className="bg-amber-600 text-amber-100 hover:bg-amber-600">{pendingUsers.length}</Badge>
                </div>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-700 bg-[#0f1729]">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm text-slate-400">Name</th>
                        <th className="px-6 py-4 text-left text-sm text-slate-400">Role</th>
                        <th className="px-6 py-4 text-left text-sm text-slate-400">Email</th>
                        <th className="px-6 py-4 text-left text-sm text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((user) => (
                        <tr key={user.id} className="border-b border-slate-700 last:border-0 hover:bg-[#0f1729]">
                          <td className="px-6 py-4 text-sm text-slate-200">{user.name}</td>
                          <td className="px-6 py-4">
                            <Badge className="bg-blue-600 text-blue-100 hover:bg-blue-600">{user.requestedRole}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">{user.email}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button size="sm" onClick={() => handleShowDetails(user)} variant="ghost" className="text-slate-400 hover:text-slate-200">View Details</Button>
                              <Button size="sm" onClick={() => handleApproveClick(user)} className="bg-green-700 text-green-100 hover:bg-green-600">
                                <Check className="mr-1 h-4 w-4" /> Approve
                              </Button>
                              <Button size="sm" onClick={() => handleRejectUser(user.id)} variant="outline" className="border-red-700 text-red-400 hover:bg-red-950">
                                <X className="mr-1 h-4 w-4" /> Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Clients Section */}
        <div className="mb-8">
          <h3 className="mb-4 text-2xl text-white">Clients</h3>
          <Card className="border-slate-700 bg-[#1a2332]">
            <CardContent className="p-0 text-slate-200">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 border-b border-slate-700 bg-[#0f1729]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Name</th>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Email</th>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Lawyer</th>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Paralegal</th>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Status</th>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(user => (
                      <tr key={user.id} className="border-b border-slate-700 last:border-0 hover:bg-[#0f1729]">
                        <td className="px-6 py-4 text-sm">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{user.assignedLawyerName}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{user.assignedParalegalName}</td>
                        <td className="px-6 py-4 text-sm"><Badge className={getStatusColor(user.status)}>{user.status}</Badge></td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => handleEditUser(user as any)}><Edit className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => handleAssignContract(user.id)}><FileText className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Paralegals Section */}
        <div className="mb-8">
          <h3 className="mb-4 text-2xl text-white">Paralegals</h3>
          <Card className="border-slate-700 bg-[#1a2332]">
            <CardContent className="p-0 text-slate-200">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 border-b border-slate-700 bg-[#0f1729]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Name</th>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Email</th>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Lawyer</th>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Status</th>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paralegals.map(user => (
                      <tr key={user.id} className="border-b border-slate-700 last:border-0 hover:bg-[#0f1729]">
                        <td className="px-6 py-4 text-sm">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{user.assignedLawyerName}</td>
                        <td className="px-6 py-4 text-sm"><Badge className={getStatusColor(user.status)}>{user.status}</Badge></td>
                        <td className="px-6 py-4 text-sm flex gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => handleEditUser(user as any)}><Edit className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lawyers Section */}
        <div className="mb-8">
          <h3 className="mb-4 text-2xl text-white">Lawyers</h3>
          <Card className="border-slate-700 bg-[#1a2332]">
            <CardContent className="p-0 text-slate-200">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 border-b border-slate-700 bg-[#0f1729]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Name</th>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Email</th>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Status</th>
                      <th className="px-6 py-4 text-left text-sm text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lawyers.map(user => (
                      <tr key={user.id} className="border-b border-slate-700 last:border-0 hover:bg-[#0f1729]">
                        <td className="px-6 py-4 text-sm">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{user.email}</td>
                        <td className="px-6 py-4 text-sm"><Badge className={getStatusColor(user.status)}>{user.status}</Badge></td>
                        <td className="px-6 py-4 text-sm flex gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => handleEditUser(user as any)}><Edit className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ApprovalAssignmentDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen} user={selectedPendingUser} onApprove={confirmApproval} />
      <AddEditUserDialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen} user={editingUser} role={selectedRole} onSave={handleSaveUser} />
      <AssignContractDialog open={assignContractDialogOpen} onOpenChange={setAssignContractDialogOpen} userId={selectedUserId} />

      {/* Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-md border-slate-700 bg-[#1a2332] text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Registration Details</DialogTitle>
          </DialogHeader>
          {detailsUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-slate-400">Name</div>
                <div className="col-span-2 text-sm text-slate-200">{detailsUser.name}</div>

                <div className="text-sm text-slate-400">Email</div>
                <div className="col-span-2 text-sm text-slate-200">{detailsUser.email}</div>

                <div className="text-sm text-slate-400">Role</div>
                <div className="col-span-2 text-sm px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 w-fit">{detailsUser.requestedRole}</div>

                <div className="text-sm text-slate-400">Message</div>
                <div className="col-span-2 text-sm text-slate-300 bg-[#0f1729] p-3 rounded-md italic">"{detailsUser.reason}"</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDetailsOpen(false)} className="bg-slate-700 text-slate-200 hover:bg-slate-600">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
