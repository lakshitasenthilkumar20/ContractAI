import { Scale, Briefcase, Users, Settings } from "lucide-react";

export function TargetUsersSection() {
  const users = [
    {
      icon: Scale,
      title: "Lawyers",
      description: "Streamline contract review and focus on high-value legal analysis"
    },
    {
      icon: Briefcase,
      title: "Paralegals",
      description: "Efficiently manage and organize contract documents with AI assistance"
    },
    {
      icon: Users,
      title: "Clients",
      description: "Understand contract terms clearly without extensive legal knowledge"
    },
    {
      icon: Settings,
      title: "Administrators",
      description: "Manage system access and oversee contract workflows securely"
    }
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl mb-12 text-center tracking-tight">
          Target Users
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {users.map((user, index) => (
            <div 
              key={index}
              className="bg-[#1a2332] border border-slate-700 p-6 rounded-lg text-center hover:border-slate-600 transition-colors"
            >
              <div className="bg-slate-700/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <user.icon className="size-8 text-slate-300" />
              </div>
              <h3 className="text-lg mb-2 text-white">
                {user.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {user.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
