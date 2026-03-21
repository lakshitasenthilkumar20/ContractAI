import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-[#0a0f1a] border-t border-slate-800 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Logo and Brand */}
          <Logo iconSize={20} textSize="text-lg" />

          {/* Academic Note */}
          <p className="text-sm text-slate-400">
            Academic Project – Data Science & Software Engineering
          </p>

          {/* Copyright */}
          <p className="text-sm text-slate-500">
            © 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
