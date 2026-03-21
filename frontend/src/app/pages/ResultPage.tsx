import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Info, CheckCircle2, AlertCircle, Cpu, Zap } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { SharedHeader } from "../components/SharedHeader";
import { Footer } from "../components/Footer";
import { authService } from "../services/authService";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Cell
} from "recharts";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";

interface ModelMetrics {
    model: string;
    accuracy: number;
    f1_score: number;
    precision: number;
    recall: number;
    roc_auc: number;
    confusion_matrix?: string;
}

interface ModelPrediction {
    contract_type: string;
    confidence: number;
    controlled_confidence: number;
}

interface MLResultDoc {
    contract_id: string;
    model_predictions: Record<string, ModelPrediction>;
    best_prediction: {
        contract_type: string;
        controlled_confidence: number;
    };
    explainatory_result: Array<{ word: string; score: number }>;
}

export function ResultPage() {
    const { contractId } = useParams<{ contractId: string }>();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<ModelMetrics[]>([]);
    const [mlResult, setMlResult] = useState<MLResultDoc | null>(null);
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState<ModelMetrics | null>(null);
    const [user, setUser] = useState<any>(null);
    const [hoveredModel, setHoveredModel] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!contractId) return;
            try {
                const [metricsRes, mlResultRes, userData] = await Promise.all([
                    fetch("http://localhost:8000/ml-metrics").then(res => res.json()),
                    fetch(`http://localhost:8000/contracts/${contractId}/results/ml`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    }).then(res => res.json()),
                    authService.getCurrentUser().catch(() => null)
                ]);

                // The backend returns a list of ml results for that contract, take the first one
                const resultDoc = (mlResultRes && mlResultRes.length > 0) ? mlResultRes[0] : null;
                setMetrics(metricsRes);
                setMlResult(resultDoc);

                if (userData) {
                    const u = userData as any;
                    setUser({
                        name: u.full_name || u.username || "User",
                        role: u.role,
                        initials: (u.full_name || u.username || "U").substring(0, 2).toUpperCase()
                    });
                }

                // If we want contract title etc.
                const contractData = await fetch(`http://localhost:8000/contracts/${contractId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }).then(res => res.json());
                setContract(contractData);

            } catch (error) {
                console.error("Failed to fetch Result data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [contractId]);

    const handleBack = () => {
        const from = new URLSearchParams(window.location.search).get('from');
        if (from) navigate(from);
        else if (user?.role === 'admin') navigate('/admin-dashboard');
        else if (user?.role === 'client') navigate('/client-dashboard');
        else if (user?.role === 'lawyer') navigate('/lawyer-dashboard');
        else if (user?.role === 'paralegal') navigate('/paralegal-dashboard');
        else navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f1729] text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Process sorted models for sidebar
    const sortedModels = Object.entries(mlResult?.model_predictions || {})
        .map(([name, pred]: [string, any]) => ({
            name,
            ...pred,
            global: metrics.find(m => m.model.toLowerCase() === name.toLowerCase())
        }))
        .sort((a, b) => b.controlled_confidence - a.controlled_confidence);

    // Graph 1: Comparative Controlled Confidence for the elected type across models
    const electedType = mlResult?.best_prediction?.contract_type;
    const comparativeData = sortedModels.map(sm => ({
        name: sm.name,
        confidence: sm.controlled_confidence * 100,
        type: sm.contract_type
    }));

    // Graph 2: Type chosen by models with hue based on avg controlled confidence
    const preds = mlResult?.model_predictions || {};
    const typeDistribution = Object.values(preds).reduce((acc: any, curr: any) => {
        const t = curr.contract_type;
        if (!acc[t]) acc[t] = { type: t, count: 0, totalConf: 0 };
        acc[t].count += 1;
        acc[t].totalConf += curr.controlled_confidence;
        return acc;
    }, {});

    const typeChartData = Object.values(typeDistribution).map((d: any) => ({
        type: d.type,
        count: d.count,
        avgConf: (d.totalConf / d.count) * 100
    }));

    const renderConfusionMatrix = (matrixStr: string) => {
        if (!matrixStr) return null;
        try {
            const matrix = JSON.parse(matrixStr);
            // Limit to first 10 for readability in UI, or full if requested.
            // But let's make it look like a heat map.
            return (
                <div className="mt-6">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-4 text-center">Prediction Hit Map (Confusion Matrix)</p>
                    <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-[2px] bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                        {matrix.map((row: number[], i: number) => (
                            row.map((val: number, j: number) => {
                                // Intensity based on value
                                const intensity = Math.min(val * 15, 100);
                                const isDiagonal = i === j;
                                return (
                                    <div
                                        key={`${i}-${j}`}
                                        className={`aspect-square flex items-center justify-center text-[8px] rounded-[1px] transition-all`}
                                        style={{
                                            backgroundColor: val > 0
                                                ? (isDiagonal ? `rgba(16, 185, 129, ${0.1 + intensity / 100})` : `rgba(59, 130, 246, ${0.1 + intensity / 100})`)
                                                : 'transparent',
                                            color: val > 0 ? (intensity > 50 ? '#fff' : '#94a3b8') : 'transparent',
                                            border: isDiagonal && val > 0 ? '1px solid rgba(16, 185, 129, 0.5)' : 'none'
                                        }}
                                        title={`Actual: ${i}, Predicted: ${j}, Count: ${val}`}
                                    >
                                        {val > 0 ? val : ''}
                                    </div>
                                );
                            })
                        ))}
                    </div>
                    <div className="flex justify-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                            <span className="text-[9px] text-slate-500 uppercase font-medium">Correct</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                            <span className="text-[9px] text-slate-500 uppercase font-medium">Misclassified</span>
                        </div>
                    </div>
                </div>
            );
        } catch { return null; }
    };

    const getElectedColor = (conf: number) => {
        if (conf >= 80) return "#10b981"; // Emerald
        if (conf >= 60) return "#3b82f6"; // Blue
        return "#f59e0b"; // Amber
    };

    const agreementValue = hoveredModel && mlResult ? (
        Object.values(mlResult.model_predictions).filter(p => p.contract_type === mlResult.model_predictions[hoveredModel].contract_type).length /
        Object.keys(mlResult.model_predictions).length
    ) : 0;

    return (
        <div className="min-h-screen bg-[#0f1729] text-white font-inter">
            <SharedHeader isLoggedIn={true} user={user} />

            <main className="max-w-[1500px] mx-auto px-6 py-8 space-y-8">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBack}
                            className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-white uppercase tracking-tight">
                                {contract?.title || "ANALYSIS"}
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                                    Final Decision: {electedType}
                                </Badge>
                                <span className="text-slate-500 text-sm">
                                    Elected with {((mlResult?.best_prediction?.controlled_confidence ?? 0) * 100).toFixed(1)}% confidence
                                </span>
                                <Button
                                    size="sm"
                                    onClick={handleBack}
                                    className="bg-slate-700 hover:bg-slate-600 text-[10px] h-7 px-3 border border-slate-600"
                                >
                                    GO TO DASHBOARD
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar: Models List (LG-3) */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Cpu className="h-5 w-5 text-blue-500" />
                                Model Ranking
                            </h3>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Sorted by Score</span>
                        </div>
                        <div className="space-y-3 max-h-[85vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                            {sortedModels.map((m) => (
                                <button
                                    key={m.name}
                                    className={`w-full text-left bg-[#161e2d] border border-slate-800 rounded-xl hover:border-blue-500 hover:bg-[#1c263b] transition-all cursor-pointer group p-4 relative overflow-hidden ${hoveredModel === m.name ? 'border-blue-500 ring-1 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : ''}`}
                                    onClick={() => setSelectedModel(m.global)}
                                    onMouseEnter={() => setHoveredModel(m.name)}
                                    onMouseLeave={() => setHoveredModel(null)}
                                >
                                    {hoveredModel === m.name && (
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium text-slate-100 group-hover:text-blue-400 transition-colors uppercase text-xs tracking-wider">
                                            {m.name}
                                        </div>
                                        <div className={`text-xs font-bold ${m.controlled_confidence > 0.7 ? 'text-emerald-400' : 'text-blue-400'}`}>
                                            {(m.controlled_confidence * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest truncate max-w-[120px]">
                                            {m.contract_type}
                                        </div>
                                        <Info className="h-3 w-3 text-slate-600 group-hover:text-blue-400" />
                                    </div>
                                    {/* Confidence bar */}
                                    <div className="h-1 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${m.controlled_confidence > 0.7 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                            style={{ width: `${m.controlled_confidence * 100}%` }}
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Visualizations (LG-9) */}
                    <div className="lg:col-span-9 space-y-8">
                        {/* Graphs Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            {/* Graph 1: Comparative Confidence */}
                            <Card className="bg-[#161e2d] border-slate-800 overflow-hidden shadow-lg hover:shadow-blue-500/10 transition-shadow">
                                <CardHeader className="border-b border-slate-800/50 pb-4">
                                    <CardTitle className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400">
                                        <BarChart3 className="h-4 w-4 text-blue-500" />
                                        Model Agreement
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="h-[250px] pt-6 pr-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={comparativeData} onMouseMove={(data) => {
                                            if (data?.activeLabel) setHoveredModel(data.activeLabel);
                                        }} onMouseLeave={() => setHoveredModel(null)}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="name" hide />
                                            <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)' }}
                                                itemStyle={{ color: '#60a5fa', fontSize: '11px', fontWeight: 'bold' }}
                                                labelStyle={{ fontSize: '10px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}
                                            />
                                            <Bar dataKey="confidence" radius={[6, 6, 0, 0]} barSize={30}>
                                                {comparativeData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.type === electedType ? '#3b82f6' : '#1e293b'}
                                                        stroke={entry.type === electedType ? '#60a5fa' : '#334155'}
                                                        strokeWidth={hoveredModel === entry.name ? 2 : 1}
                                                        fillOpacity={hoveredModel === entry.name ? 1 : 0.8}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Graph 2: Prediction Spread */}
                            <Card className="bg-[#161e2d] border-slate-800 overflow-hidden shadow-lg hover:shadow-emerald-500/10 transition-shadow">
                                <CardHeader className="border-b border-slate-800/50 pb-4">
                                    <CardTitle className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400">
                                        <Zap className="h-4 w-4 text-emerald-500" />
                                        Prediction Spread
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="h-[250px] pt-6 pr-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={typeChartData}
                                            layout="vertical"
                                            margin={{ left: 10, right: 30 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="type" type="category" stroke="#94a3b8" fontSize={9} width={80} />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                                itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981' }}
                                                labelStyle={{ color: '#cbd5e1', fontSize: '10px' }}
                                            />
                                            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                                                {typeChartData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={getElectedColor(entry.avgConf)}
                                                        fillOpacity={0.9}
                                                        stroke={getElectedColor(entry.avgConf)}
                                                        strokeOpacity={0.3}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Graph 3: XAI Influence */}
                            <Card className="bg-[#161e2d] border-slate-800 overflow-hidden shadow-lg hover:shadow-purple-500/10 transition-shadow">
                                <CardHeader className="border-b border-slate-800/50 pb-4">
                                    <CardTitle className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400">
                                        <Info className="h-4 w-4 text-purple-500" />
                                        Explainable AI
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="h-[250px] pt-6 pr-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={mlResult?.explainatory_result?.slice(0, 8)}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="word" stroke="#94a3b8" fontSize={9} angle={-30} textAnchor="end" interval={0} height={50} />
                                            <YAxis stroke="#475569" fontSize={9} unit="%" />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                                itemStyle={{ color: '#a78bfa', fontSize: '11px', fontWeight: 'bold' }}
                                                labelStyle={{ color: '#cbd5e1', fontSize: '10px' }}
                                            />
                                            <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={28}>
                                                {mlResult?.explainatory_result?.slice(0, 8).map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={index % 2 === 0 ? '#8b5cf6' : '#6366f1'}
                                                        fillOpacity={0.8}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Interactive Formula Section */}
                        <Card className="bg-[#161e2d] border-slate-800 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Info className="h-4 w-4 text-blue-500" />
                                    Controlled Confidence Scoring
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-8">
                                <div className="bg-[#0f172a] rounded-xl p-8 border border-slate-800/50">
                                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
                                        {/* Formula Components */}
                                        <div className="space-y-2">
                                            <div className="text-xs text-slate-500 uppercase tracking-widest">Prediction</div>
                                            <div className="text-2xl font-bold text-slate-200">
                                                0.4 <span className="text-slate-600 text-lg">×</span> {(hoveredModel && mlResult?.model_predictions[hoveredModel]) ? (mlResult.model_predictions[hoveredModel].confidence).toFixed(2) : "Conf"}
                                            </div>
                                        </div>
                                        <div className="text-2xl text-slate-700">+</div>
                                        <div className="space-y-2">
                                            <div className="text-xs text-slate-500 uppercase tracking-widest">Global Acc</div>
                                            <div className="text-2xl font-bold text-slate-200">
                                                0.3 <span className="text-slate-600 text-lg">×</span> {hoveredModel ? (metrics.find(m => m.model.toLowerCase() === hoveredModel.toLowerCase())?.accuracy || 0.5).toFixed(2) : "Acc"}
                                            </div>
                                        </div>
                                        <div className="text-2xl text-slate-700">+</div>
                                        <div className="space-y-2">
                                            <div className="text-xs text-slate-500 uppercase tracking-widest">Agreement</div>
                                            <div className="text-2xl font-bold text-slate-200">
                                                0.3 <span className="text-slate-600 text-lg">×</span> {hoveredModel ? agreementValue.toFixed(2) : "Agree"}
                                            </div>
                                        </div>
                                        <div className="text-2xl text-slate-500">=</div>
                                        <div className="space-y-2">
                                            <div className="text-xs text-blue-500 uppercase tracking-widest font-bold">Total Score</div>
                                            <div className="text-4xl font-black text-blue-400">
                                                {(hoveredModel && mlResult?.model_predictions[hoveredModel]) ? (mlResult.model_predictions[hoveredModel].controlled_confidence * 100).toFixed(1) : "??"}
                                                <span className="text-lg font-normal ml-1">%</span>
                                            </div>
                                        </div>
                                    </div>
                                    {hoveredModel && (
                                        <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <p className="text-sm text-slate-400">
                                                Currently viewing breakdown for <span className="text-blue-400 font-bold uppercase">{hoveredModel}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Explainable AI Tag Section (Secondary) */}
                        <Card className="bg-[#161e2d] border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-300">
                                    <Cpu className="h-4 w-4 text-purple-400" />
                                    Model Influence: Key Identifiers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {mlResult?.explainatory_result?.slice(0, 10).map((item: any, i: number) => (
                                        <div key={i} className="bg-[#0f172a] p-3 rounded-lg border border-slate-800/50 flex flex-col items-center gap-1 hover:border-blue-500/30 transition-colors">
                                            <span className="text-xs text-slate-200 font-medium">{item.word}</span>
                                            <span className="text-[10px] text-blue-400 font-bold">{item.score}%</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Detail Dialog for Model Metrics */}
            <Dialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
                <DialogContent className="bg-[#0f172a] border-slate-800 text-white max-w-4xl shadow-2xl p-0 overflow-hidden rounded-2xl max-h-[90vh] flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-[120px] bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none z-0" />

                    <DialogHeader className="p-8 pb-0 relative z-10 shrink-0">
                        <DialogTitle className="text-3xl flex items-center gap-4 uppercase font-black tracking-tighter">
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <Cpu className="h-8 w-8 text-blue-500" />
                            </div>
                            <div>
                                <span className="block text-[10px] text-blue-500 tracking-[0.3em] font-bold mb-1">Global Performance</span>
                                {selectedModel?.model} Analysis
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-8 pt-6 space-y-8 overflow-y-auto relative z-10 custom-scrollbar flex-1">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Accuracy', val: selectedModel?.accuracy, col: 'text-blue-400', icon: CheckCircle2 },
                                { label: 'F1 Score', val: selectedModel?.f1_score, col: 'text-purple-400', icon: Zap },
                                { label: 'Precision', val: selectedModel?.precision, col: 'text-emerald-400', icon: BarChart3 },
                                { label: 'Recall', val: selectedModel?.recall, col: 'text-amber-400', icon: Info },
                            ].map((stat) => (
                                <div key={stat.label} className="p-5 rounded-2xl bg-[#161e2d] border border-slate-800/50 relative overflow-hidden group hover:border-slate-700 transition-all">
                                    <stat.icon className={`h-12 w-12 absolute -right-2 -bottom-2 opacity-5 ${stat.col} group-hover:scale-110 transition-transform`} />
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">{stat.label}</div>
                                    <div className={`text-3xl font-black ${stat.col}`}>
                                        {((stat.val || 0) * 100).toFixed(1)}<span className="text-sm font-normal ml-0.5">%</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-[#070b14] p-8 rounded-2xl border border-slate-800/30 relative shadow-inner">
                            <div className="absolute top-4 right-8">
                                <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-slate-800 text-slate-500">Full Dataset Coverage</Badge>
                            </div>
                            {selectedModel?.confusion_matrix && renderConfusionMatrix(selectedModel.confusion_matrix)}
                        </div>

                        <div className="flex justify-between items-center bg-[#161e2d] p-4 rounded-xl border border-slate-800/50">
                            <div className="text-xs text-slate-400 max-w-[400px]">
                                <AlertCircle className="h-4 w-4 inline mr-2 text-blue-500" />
                                These metrics represent the model's global performance across the entire validated dataset, not just this specific contract.
                            </div>
                            <Button
                                onClick={() => setSelectedModel(null)}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                            >
                                CLOSE ANALYSIS
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
}
