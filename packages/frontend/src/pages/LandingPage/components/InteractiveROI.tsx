import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, Zap, AlertCircle } from 'lucide-react';

const InteractiveROI: React.FC = () => {
    const [investment, setInvestment] = useState(50000);
    const [efficiency, setEfficiency] = useState(1.5); // 1.5 = 150%

    const [recoveredProfit, setRecoveredProfit] = useState(0);

    useEffect(() => {
        // Logic remains the same
        const baseWaste = investment * 0.30;
        const wasteRecovered = baseWaste * 0.7;
        const efficiencyGain = investment * ((efficiency - 1) * 0.6);

        setRecoveredProfit(wasteRecovered + efficiencyGain);
    }, [investment, efficiency]);

    return (
        <section className="py-24 relative overflow-hidden bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="bg-white rounded-3xl p-8 md:p-16 relative overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100">

                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-60" />

                    <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">

                        {/* Controls Side */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100 mb-8">
                                <Calculator className="w-3 h-3" />
                                <span>利润漏洞检测</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-slate-900 leading-tight">
                                你可能每年 <br />
                                <span className="text-red-600">
                                    隐形亏损
                                </span>
                            </h2>
                            <p className="text-slate-600 mb-12 text-lg">
                                拖动滑块，看看如果继续使用 "Excel + 微信" 管理，你的品牌可能会流失多少净利润。
                            </p>

                            <div className="space-y-12">
                                {/* Investment Slider */}
                                <div className="relative group">
                                    <div className="flex justify-between mb-4 items-end">
                                        <label className="text-sm font-bold text-slate-500">月度寄样预算</label>
                                        <span className="text-2xl font-mono font-bold text-slate-900">¥ {investment.toLocaleString()}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10000" max="500000" step="10000"
                                        value={investment}
                                        onChange={(e) => setInvestment(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                    />
                                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                                        <span>¥10k</span>
                                        <span>¥500k</span>
                                    </div>
                                </div>

                                {/* Efficiency Slider */}
                                <div className="relative group">
                                    <div className="flex justify-between mb-4 items-end">
                                        <label className="text-sm font-bold text-slate-500">样品回收/带货率目标</label>
                                        <span className="text-2xl font-mono font-bold text-purple-600">{(efficiency * 100).toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1" max="2.5" step="0.1"
                                        value={efficiency}
                                        onChange={(e) => setEfficiency(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 hover:accent-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                                    />
                                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                                        <span>100% (现状)</span>
                                        <span>250% (理想)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results Side */}
                        <div className="bg-slate-900 rounded-2xl p-8 md:p-12 relative flex flex-col justify-center h-full shadow-2xl text-white">
                            <h3 className="text-slate-400 font-medium mb-2 uppercase tracking-widest text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-400" />
                                可挽回的年度净利
                            </h3>

                            <AnimatePresence mode='wait'>
                                <motion.div
                                    key={recoveredProfit}
                                    initial={{ opacity: 0.5, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-baseline gap-2 mb-8"
                                >
                                    <span className="text-6xl md:text-7xl font-mono font-black text-white tracking-tighter">
                                        ¥{Math.round(recoveredProfit * 12).toLocaleString()}
                                    </span>
                                </motion.div>
                            </AnimatePresence>

                            <div className="grid grid-cols-2 gap-4 mb-10">
                                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-300">
                                        <DollarSign className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase">样品白嫖挽回</span>
                                    </div>
                                    <div className="text-xl font-bold text-white">¥{Math.round((recoveredProfit * 0.40) * 12).toLocaleString()}</div>
                                </div>
                                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                    <div className="flex items-center gap-2 mb-2 text-purple-300">
                                        <Zap className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase">撞单/内耗节省</span>
                                    </div>
                                    <div className="text-xl font-bold text-white">¥{Math.round((recoveredProfit * 0.60) * 12).toLocaleString()}</div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-4 rounded-xl bg-white text-slate-900 font-bold text-lg hover:bg-indigo-50 transition-colors shadow-lg shadow-black/20 flex items-center justify-center gap-2"
                            >
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                                算算我的隐形亏损
                            </motion.button>

                            <p className="text-center text-slate-500 text-xs mt-4">
                                *基于行业平均样品丢失率与人效数据估算
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default InteractiveROI;
