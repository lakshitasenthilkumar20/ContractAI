import { Link } from "react-router-dom";
import { FileText, Home, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f1729] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="bg-slate-700/50 p-2 rounded-lg">
              <FileText className="size-6 text-slate-300" />
            </div>
            <span className="text-xl tracking-tight text-white">
              Contract AI
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-2xl">
          <div className="mb-8">
            <h1 className="text-8xl mb-4 text-slate-600">404</h1>
            <h2 className="text-3xl mb-4 tracking-tight">Page Not Found</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              variant="outline"
              className="bg-slate-700/30 border-slate-600 hover:bg-slate-600/40 text-white"
            >
              <Link to="/">
                <ArrowLeft className="size-4 mr-2" />
                Go Back
              </Link>
            </Button>
            <Button
              asChild
              className="bg-slate-600 hover:bg-slate-500 text-white"
            >
              <Link to="/login">
                <Home className="size-4 mr-2" />
                Go to Login
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-slate-400 mb-1">Contract AI</p>
              <p className="text-sm text-slate-500">
                Academic Project – Data Science & Software Engineering
              </p>
            </div>
            <p className="text-sm text-slate-500">© 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
