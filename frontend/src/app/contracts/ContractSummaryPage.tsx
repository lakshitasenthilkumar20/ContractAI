import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Download, CheckCircle, XCircle, Shield, LogOut, BarChart4, Target, Zap, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { authService } from "../services/authService";
import { contractService } from "../services/contractService";

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "uploaded":
      return "bg-slate-600 text-slate-100";
    case "under review":
    case "processing":
      return "bg-blue-600 text-blue-100";
    case "analyzed":
      return "bg-purple-600 text-purple-100";
    case "summary ready":
    case "reviewed":
      return "bg-indigo-600 text-indigo-100";
    case "approved":
    case "completed":
      return "bg-green-600 text-green-100";
    case "requires revision":
      return "bg-amber-600 text-amber-100";
    default:
      return "bg-gray-600 text-gray-100";
  }
};

export function ContractSummaryPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = new URLSearchParams(window.location.search);
  const fromPath = location.get('from') || "/";

  const [user, setUser] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [results, setResults] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [userData, contractData, resultsData] = await Promise.all([
          authService.getCurrentUser() as Promise<any>,
          contractService.getContract(id),
          contractService.getResults(id).catch(() => null)
        ]);

        setUser({
          name: userData.full_name || userData.username || "User",
          role: userData.role,
          initials: (userData.full_name || userData.username || "U").substring(0, 2).toUpperCase()
        });
        setContract(contractData);
        setResults(Array.isArray(resultsData) ? resultsData[0] : resultsData);
      } catch (error) {
        console.error("Failed to fetch contract details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1729] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1729]">
        <div className="text-center">
          <h2 className="text-2xl text-white">Contract not found</h2>
          <Button onClick={() => navigate(fromPath)} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleApprove = async () => {
    try {
      await contractService.updateStatus(contract.id, "approved");
      alert("Contract approved!");
      navigate(fromPath);
    } catch (e) {
      console.error("Failed to approve:", e);
    }
  };

  const handleReject = async () => {
    try {
      await contractService.updateStatus(contract.id, "Requires Revision");
      alert("Contract rejected / requested revision.");
      navigate(fromPath);
    } catch (e) {
      console.error("Failed to reject:", e);
    }
  };

  const handleDownloadSummary = () => {
    const content = `Contract: ${contract.title}\nSummary: ${results?.summary || "No summary available"}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `summary_${contract.id}.txt`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0f1729]">
      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-700 bg-[#1a2332]">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(fromPath)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl text-white">Contract AI</span>
              </button>
              <div className="h-6 w-px bg-slate-700" />
              <h1 className="text-xl text-slate-200">Contract Summary</h1>
            </div>

            {/* Right: User Avatar and Logout */}
            <div className="flex items-center gap-4">
              <Avatar className="h-9 w-9 bg-slate-700">
                <AvatarFallback className="bg-slate-700 text-slate-200">{user?.initials || "U"}</AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-200"
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate('/login');
                }}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        {/* Back Button */}
        <Button
          onClick={() => navigate(fromPath)}
          variant="ghost"
          className="mb-6 text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[350px_1fr]">
          {/* Left Sidebar - Contract Details */}
          <div className="space-y-4">
            <Card className="border-slate-700 bg-[#1a2332]">
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg text-white">Contract Details</h3>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Contract ID</div>
                    <div className="mt-1 text-sm text-slate-200">{contract.id}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Status</div>
                    <div className="mt-1">
                      <Badge className={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Filename</div>
                    <div className="mt-1 text-sm text-slate-200">{contract.filename}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Upload Date</div>
                    <div className="mt-1 text-sm text-slate-200">
                      {new Date(contract.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-[#1a2332]">
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg text-white">Assigned Team</h3>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Client</div>
                    <div className="mt-1 text-sm text-slate-200">{contract.client_id || "Direct Upload"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Paralegal</div>
                    <div className="mt-1 text-sm text-slate-200">Assigned Team</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Lawyer</div>
                    <div className="mt-1 text-sm text-slate-200">Lead Attorney</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleDownloadSummary}
                className="w-full bg-slate-700 text-slate-100 hover:bg-slate-600"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Summary
              </Button>
              <Button
                onClick={handleApprove}
                className="w-full bg-green-700 text-green-100 hover:bg-green-600"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Contract
              </Button>
              <Button
                onClick={handleReject}
                className="w-full bg-red-700 text-red-100 hover:bg-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Contract
              </Button>
            </div>
          </div>

          {/* Main Content Area - Summary */}
          <div className="space-y-6">
            <Card className="border-slate-700 bg-[#1a2332]">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h2 className="mb-2 text-2xl text-white">{contract.title}</h2>
                  <div className="text-sm text-slate-400">Contract Summary</div>
                </div>

                <div className="rounded-lg border border-slate-700 bg-[#0f1729] p-6">
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
                    {results && results.summary ? results.summary : (contract.status === 'analyzed' ? 'No summary available for this analyzed contract.' : 'Analysis for this contract is being processed. Please check back shortly.')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights & Metrics Section */}
            {results?.evaluation_metrics && (
              <Card className="border-slate-700 bg-[#1a2332] overflow-hidden">
                <div className="border-b border-slate-700 bg-slate-800/50 px-8 py-4">
                  <div className="flex items-center gap-2">
                    <BarChart4 className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-medium text-white">AI Analysis Insights</h3>
                  </div>
                </div>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Quality Score (ROUGE) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-400" />
                          Retention (ROUGE-L)
                        </span>
                        <span className="text-white font-medium">{(results.evaluation_metrics.rougeL * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                          style={{ width: `${results.evaluation_metrics.rougeL * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">Measures how well the summary retains the original content structure.</p>
                    </div>

                    {/* Grounding (Evidence Density) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-400" />
                          Evidence Density
                        </span>
                        <span className="text-white font-medium">{(results.evaluation_metrics.evidence_density * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                          style={{ width: `${results.evaluation_metrics.evidence_density * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">Percentage of the summary directly derived from contract evidence.</p>
                    </div>

                    {/* Hallucination Risk (Unsupported Ratio) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-red-400" />
                          Hallucination Risk
                        </span>
                        <span className="text-white font-medium">{(results.evaluation_metrics.unsupported_ratio * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all duration-1000"
                          style={{ width: `${results.evaluation_metrics.unsupported_ratio * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">Detected summary content that is not explicitly stated in the source.</p>
                    </div>

                    {/* Entities Found */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Search className="h-4 w-4 text-blue-400" />
                          Entities Detected
                        </span>
                        <span className="text-white font-medium">{results.evaluation_metrics.ner_count} items</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {results.entities?.slice(0, 5).map((ent: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-[10px] bg-blue-500/10 text-blue-300 border-blue-500/30">
                            {ent.word}
                          </Badge>
                        ))}
                        {results.entities?.length > 5 && <span className="text-[10px] text-slate-500">+{results.entities.length - 5} more</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
