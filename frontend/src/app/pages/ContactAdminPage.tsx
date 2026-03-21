import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, User, Briefcase, MessageSquare, Send, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Logo } from "../components/Logo";
import { SharedHeader } from "../components/SharedHeader";
import { Footer } from "../components/Footer";
import { registrationService } from "../services/registrationService";
import { Lock } from "lucide-react";

export function ContactAdminPage() {
    const navigate = useNavigate();
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "Client",
        message: "",
        password: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");
        try {
            await registrationService.createRegistration(formData);
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || "Failed to submit application");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#0f1729] text-white flex flex-col font-inter">
                <SharedHeader />
                <main className="flex-1 flex items-center justify-center px-6">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                            <Send className="text-green-400 size-8" />
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight">Application Sent</h1>
                        <p className="text-slate-400">
                            Your application has been received. Our administrators will review your request and contact you via email soon.
                        </p>
                        <Button
                            onClick={() => navigate("/")}
                            className="mt-8 bg-blue-600 hover:bg-blue-500 text-white w-full"
                        >
                            Back to Home
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f1729] text-white flex flex-col font-inter">
            <SharedHeader />
            <main className="flex-1 flex items-center justify-center py-12 px-6">
                <div className="w-full max-w-xl">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="mb-8 text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="mr-2 size-4" />
                        Back
                    </Button>

                    <div className="bg-[#1a2332]/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 md:p-10">
                        <div className="mb-10">
                            <h1 className="text-3xl font-semibold mb-2 tracking-tight">Access Request</h1>
                            <p className="text-slate-400">
                                Apply for a new account or request specialized access to the platform.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm text-slate-300">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        className="pl-10 bg-[#0f1729]/80 border-slate-700/50 text-white placeholder:text-slate-500 h-11"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm text-slate-300">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        className="pl-10 bg-[#0f1729]/80 border-slate-700/50 text-white placeholder:text-slate-500 h-11"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-sm text-slate-300">Desired Role</Label>
                                <select
                                    id="role"
                                    className="w-full h-11 bg-[#0f1729]/80 border border-slate-700/50 rounded-md px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="Client">Client / Organization</option>
                                    <option value="Paralegal">Paralegal</option>
                                    <option value="Lawyer">Lawyer</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" title="password" className="text-sm text-slate-300">Set Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 bg-[#0f1729]/80 border-slate-700/50 text-white placeholder:text-slate-500 h-11"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message" className="text-sm text-slate-300">Why do you need access?</Label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3 size-4 text-slate-500" />
                                    <Textarea
                                        id="message"
                                        placeholder="Briefly describe your use case or organization..."
                                        className="pl-10 bg-[#0f1729]/80 border-slate-700/50 text-white placeholder:text-slate-500 min-h-[120px]"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 text-base font-medium mt-4"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Application"}
                            </Button>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
