import { FileText } from "lucide-react";

interface LogoProps {
    className?: string;
    iconSize?: number;
    textSize?: string;
}

export function Logo({ className = "", iconSize = 24, textSize = "text-xl" }: LogoProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="bg-slate-700/50 p-2 rounded-lg">
                <FileText size={iconSize} className="text-slate-300" />
            </div>
            <span className={`${textSize} tracking-tight text-white font-semibold`}>
                Contract <span className="text-blue-400">AI</span>
            </span>
        </div>
    );
}
