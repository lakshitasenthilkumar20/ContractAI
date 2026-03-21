import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, AlertCircle, X } from "lucide-react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Logo } from "../components/Logo";
import { authService } from "../services/authService";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Login initiated...');
      const loginData = await authService.login(email, password);
      console.log('Auth service login complete', loginData);

      // Fetch user details to get the role
      console.log('Fetching current user...');
      const userData: any = await authService.getCurrentUser();
      console.log('User data received:', userData);
      const role = userData.role;

      // Route based on role from backend
      console.log('Navigating based on role:', role);
      if (role === 'client') {
        navigate("/client-dashboard");
      } else if (role === 'paralegal') {
        navigate("/paralegal-dashboard");
      } else if (role === 'lawyer') {
        navigate("/lawyer-dashboard");
      } else if (role === 'admin') {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1729] text-white flex flex-col font-inter">
      {/* Header */}
      <header className="py-6 px-6 md:px-12">
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <Logo iconSize={20} textSize="text-lg" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
          {/* Side Content - Hidden on mobile */}
          <div className="hidden lg:block">
            <h1 className="text-4xl mb-4 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-md">
              Review, analyze, and manage contracts securely with AI-powered insights.
            </p>
          </div>

          {/* Login Form Card */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-[#1a2332]/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 md:p-10">
              <div className="mb-8">
                <h2 className="text-2xl mb-2 tracking-tight">
                  Sign In
                </h2>
                <p className="text-sm text-slate-400">
                  Secure, role-based access to Contract AI
                </p>
              </div>

              {/* Error Notification */}
              {error && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-200">Login Failed</p>
                      <p className="text-xs text-red-400 mt-0.5">{error}</p>
                    </div>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-500/70 hover:text-red-500 transition-colors p-1"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-slate-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-[#0f1729]/80 border-slate-600/50 text-white placeholder:text-slate-500 h-11 rounded-lg"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm text-slate-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-[#0f1729]/80 border-slate-600/50 text-white placeholder:text-slate-500 h-11 rounded-lg"
                      required
                    />
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <a href="#" className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
                    Forgot password?
                  </a>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full bg-slate-600 hover:bg-slate-500 text-white h-11 rounded-lg transition-colors"
                >
                  Login
                </Button>
              </form>

              {/* Contact Administrator */}
              <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
                <p className="text-sm text-slate-400">
                  Need access?{" "}
                  <Link to="/contact-admin" className="text-slate-300 hover:text-white transition-colors">
                    Contact Administrator
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 text-center">
        <p className="text-sm text-slate-500">
          © 2026 Contract AI
        </p>
      </footer>
    </div>
  );
}