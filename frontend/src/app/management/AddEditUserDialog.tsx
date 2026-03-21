import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
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
import { Switch } from "../components/ui/switch";

type UserRole = "Client" | "Paralegal" | "Lawyer";
type UserStatus = "Active" | "Inactive" | "Suspended";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  assignedContracts: number;
}

interface AddEditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  role: UserRole | null;
  onSave: (userData: Partial<User>) => void;
}

export function AddEditUserDialog({ open, onOpenChange, user, role, onSave }: AddEditUserDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: role || "Client" as UserRole,
    status: "Active" as UserStatus,
    initialContract: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        initialContract: "",
      });
    } else if (role) {
      setFormData({
        name: "",
        email: "",
        role: role,
        status: "Active",
        initialContract: "",
      });
    }
  }, [user, role, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  const isEditing = !!user;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-slate-700 bg-[#1a2332] text-slate-200">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">
            {isEditing ? "Edit User" : "Add New User"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isEditing
              ? "Update user information and settings."
              : "Create a new user account and assign initial permissions."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-slate-300">Full Name</Label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              className="mt-1 border-slate-600 bg-[#0f1729] text-slate-200"
            />
          </div>

          <div>
            <Label className="text-slate-300">Email</Label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              className="mt-1 border-slate-600 bg-[#0f1729] text-slate-200"
            />
          </div>

          <div>
            <Label className="text-slate-300">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}
            >
              <SelectTrigger className="mt-1 border-slate-600 bg-[#0f1729] text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-600 bg-[#1a2332]">
                <SelectItem value="Client" className="text-slate-200">Client</SelectItem>
                <SelectItem value="Paralegal" className="text-slate-200">Paralegal</SelectItem>
                <SelectItem value="Lawyer" className="text-slate-200">Lawyer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as UserStatus }))}
            >
              <SelectTrigger className="mt-1 border-slate-600 bg-[#0f1729] text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-600 bg-[#1a2332]">
                <SelectItem value="Active" className="text-slate-200">Active</SelectItem>
                <SelectItem value="Inactive" className="text-slate-200">Inactive</SelectItem>
                <SelectItem value="Suspended" className="text-slate-200">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isEditing && (
            <div>
              <Label className="text-slate-300">Initial Contract Assignment (Optional)</Label>
              <Select
                value={formData.initialContract}
                onValueChange={(value) => setFormData(prev => ({ ...prev, initialContract: value }))}
              >
                <SelectTrigger className="mt-1 border-slate-600 bg-[#0f1729] text-slate-200">
                  <SelectValue placeholder="Select a contract (optional)" />
                </SelectTrigger>
                <SelectContent className="border-slate-600 bg-[#1a2332]">
                  <SelectItem value="none" className="text-slate-200">None</SelectItem>
                  <SelectItem value="1" className="text-slate-200">Tech Services Agreement - Q1 2026</SelectItem>
                  <SelectItem value="2" className="text-slate-200">Employee NDA - Engineering Team</SelectItem>
                  <SelectItem value="3" className="text-slate-200">Office Lease Agreement 2026-2028</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-slate-600 bg-[#0f1729] p-4">
            <div>
              <div className="text-sm text-slate-200">Account Active</div>
              <div className="text-xs text-slate-400">User can access the system</div>
            </div>
            <Switch
              checked={formData.status === "Active"}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, status: checked ? "Active" : "Inactive" }))
              }
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="bg-blue-700 text-blue-100 hover:bg-blue-600">
              {isEditing ? "Save Changes" : "Add User"}
            </Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
