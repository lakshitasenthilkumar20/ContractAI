import { useNavigate, Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Logo } from "./Logo";

interface SharedHeaderProps {
    isLoggedIn?: boolean;
    user?: {
        name: string;
        role: string;
        initials: string;
    };
}

export function SharedHeader({ isLoggedIn = false, user }: SharedHeaderProps) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#0f1729]/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="hover:opacity-90 transition-opacity">
                        <Logo iconSize={20} textSize="text-lg" />
                    </Link>

                    <div className="flex items-center gap-4">
                        {isLoggedIn && user ? (
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex items-center px-3 py-1 rounded-lg bg-[#1a2332] border border-slate-700">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                                        {user.role} Dashboard
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
                                        <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-xs text-blue-300 font-medium">
                                            {user.initials}
                                        </div>
                                        <div className="hidden sm:block">
                                            <p className="text-xs text-slate-200 font-medium leading-tight">{user.name}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleLogout}
                                        className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut size={18} />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                className="bg-slate-700/30 border-slate-600 hover:bg-slate-600/40 text-white"
                                onClick={() => navigate("/login")}
                            >
                                Login
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
