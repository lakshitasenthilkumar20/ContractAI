import { FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f1729]/95 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-700/50 p-2 rounded-lg">
              <FileText className="size-6 text-slate-300" />
            </div>
            <span className="text-xl tracking-tight text-white">
              Contract AI
            </span>
          </div>

          {/* Login Button */}
          <Button 
            variant="outline" 
            className="bg-slate-700/30 border-slate-600 hover:bg-slate-600/40 text-white"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
        </div>
      </div>
    </header>
  );
}