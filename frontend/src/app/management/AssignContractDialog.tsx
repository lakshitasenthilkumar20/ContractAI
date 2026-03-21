import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";

interface AssignContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

const availableContracts = [
  { id: "1", name: "Tech Services Agreement - Q1 2026", type: "Service Agreement" },
  { id: "2", name: "Employee NDA - Engineering Team", type: "NDA" },
  { id: "3", name: "Office Lease Agreement 2026-2028", type: "Lease Agreement" },
  { id: "4", name: "Senior Developer Employment Contract", type: "Employment Contract" },
  { id: "5", name: "Vendor Service Agreement - Marketing", type: "Service Agreement" },
  { id: "6", name: "Confidentiality Agreement - Board Members", type: "NDA" },
];

export function AssignContractDialog({ open, onOpenChange, userId }: AssignContractDialogProps) {
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);

  const handleToggleContract = (contractId: string) => {
    setSelectedContracts(prev =>
      prev.includes(contractId)
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Assigning contracts:", selectedContracts, "to user:", userId);
    onOpenChange(false);
    setSelectedContracts([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-slate-700 bg-[#1a2332] text-slate-200">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Assign Contracts</DialogTitle>
          <DialogDescription className="text-slate-400">
            Select contracts to assign to this user.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="max-h-[400px] space-y-3 overflow-y-auto rounded-lg border border-slate-700 bg-[#0f1729] p-4">
            {availableContracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-start gap-3 rounded border border-slate-600 bg-[#1a2332] p-3 hover:bg-[#1f2937]"
              >
                <Checkbox
                  id={`contract-${contract.id}`}
                  checked={selectedContracts.includes(contract.id)}
                  onCheckedChange={() => handleToggleContract(contract.id)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label
                    htmlFor={`contract-${contract.id}`}
                    className="cursor-pointer text-sm text-slate-200"
                  >
                    {contract.name}
                  </label>
                  <div className="mt-1 text-xs text-slate-400">{contract.type}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="bg-blue-700 text-blue-100 hover:bg-blue-600">
              Assign Selected ({selectedContracts.length})
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
