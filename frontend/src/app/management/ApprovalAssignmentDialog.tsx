import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

interface RegistrationRequest {
    id: string;
    name: string;
    email: string;
    role: string;
    message: string;
}

interface ApprovalAssignmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: RegistrationRequest | null;
    onApprove: (id: string, assignment: { lawyer_email?: string, paralegal_email?: string }) => Promise<void>;
}

export function ApprovalAssignmentDialog({ open, onOpenChange, user, onApprove }: ApprovalAssignmentDialogProps) {
    const [lawyerEmail, setLawyerEmail] = useState("");
    const [paralegalEmail, setParalegalEmail] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setLawyerEmail("");
            setParalegalEmail("");
        }
    }, [open]);

    if (!user) return null;

    const role = user.role.toLowerCase();
    const needsLawyer = role === "client" || role === "paralegal";
    const needsParalegal = role === "client";

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const assignment: any = {};
            if (needsLawyer) assignment.lawyer_email = lawyerEmail;
            if (needsParalegal) assignment.paralegal_email = paralegalEmail;

            await onApprove(user.id, assignment);
            onOpenChange(false);
        } catch (error) {
            console.error("Approval failed:", error);
            alert("Failed to approve user. Please check if assignments are valid users.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-slate-700 bg-[#1a2332] text-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-xl text-white">Approve {user.role} Account</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Provide the necessary assignments to activate this {user.role} account.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-1">
                        <Label className="text-slate-300">User Details</Label>
                        <div className="rounded-md bg-[#0f1729] p-3 text-sm">
                            <div className="text-slate-400">Name: <span className="text-slate-200">{user.name}</span></div>
                            <div className="text-slate-400">Email: <span className="text-slate-200">{user.email}</span></div>
                        </div>
                    </div>

                    {needsLawyer && (
                        <div className="space-y-2">
                            <Label htmlFor="lawyerEmail" className="text-slate-300">Assign Lawyer (Email)</Label>
                            <Input
                                id="lawyerEmail"
                                placeholder="lawyer@example.com"
                                value={lawyerEmail}
                                onChange={(e) => setLawyerEmail(e.target.value)}
                                className="border-slate-600 bg-[#0f1729] text-slate-200"
                            />
                        </div>
                    )}

                    {needsParalegal && (
                        <div className="space-y-2">
                            <Label htmlFor="paralegalEmail" className="text-slate-300">Assign Paralegal (Email)</Label>
                            <Input
                                id="paralegalEmail"
                                placeholder="paralegal@example.com"
                                value={paralegalEmail}
                                onChange={(e) => setParalegalEmail(e.target.value)}
                                className="border-slate-600 bg-[#0f1729] text-slate-200"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-start">
                    <Button
                        type="button"
                        className="bg-green-700 text-green-100 hover:bg-green-600"
                        onClick={handleConfirm}
                        disabled={loading || (needsLawyer && !lawyerEmail) || (needsParalegal && !paralegalEmail)}
                    >
                        {loading ? "Processing..." : "Confirm & Approve"}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-slate-400 hover:text-slate-200"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
