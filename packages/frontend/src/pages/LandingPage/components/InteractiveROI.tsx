import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, Zap } from 'lucide-react';

const InteractiveROI: React.FC = () => {
  const [investment, setInvestment] = useState(50000);
  const [efficiency, setEfficiency] = useState(1.5); // 1.5 = 150%

  const [recoveredProfit, setRecoveredProfit] = useState(0);

  useEffect(() => {
    // Logic: 
    // Base Waste (Samples + Hidden Costs) ~ 25% of budget without management
    // Zilo recovers ~60% of that waste
    // Efficiency gain adds ~5% of budget per 0.1 efficiency point > 1

    const baseWaste = investment * 0.25;
    const wasteRecovered = baseWaste * 0.6;
    const efficiencyGain = investment * ((efficiency - 1) * 0.5);

    setRecoveredProfit(wasteRecovered + efficiencyGain);
  }, [investment, efficiency]);

  return (
    <section className="py-24 relative overflow-hidden bg-surface-950">
      <div className="container mx-auto px-6 relative z-10">
        <div className="glass-panel rounded-3xl p-8 md:p-16 relative overflow-hidden">

          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">

            {/* Controls Side */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 text-xs font-bold border border-brand-500/20 mb-8">
                <Calculator className="w-3 h-3" />
                <span>ROI 模拟器</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-white leading-tight">
                你的利润可能 <br />
                <span className="text-gradient from-brand-400 to-accent-400">
                  被低估了
                </span>
              </h2>
              <p className="text-surface-300 mb-12 text-lg">
                拖动滑块，模拟使用 Zilo 系统化管理带来的潜在收益。
              </p>

              <div className="space-y-12">
                {/* Investment Slider */}
                <div className="relative group">
                  <div className="flex justify-between mb-4 items-end">
                    <label className="text-sm font-bold text-surface-200">月度推广预算</label>
                    <span className="text-2xl font-mono font-bold text-white">¥ {investment.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="10000" max="500000" step="10000"
                    value={investment}
                    onChange={(e) => setInvestment(Number(e.target.value))}
                    className="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-brand-500 hover:accent-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                  <div className="flex justify-between text-xs text-surface-500 mt-2 font-mono">
                    <span>¥10k</span>
                    <span>¥500k</span>
                  </div>
                </div>

                {/* Efficiency Slider */}
                <div className="relative group">
                  <div className="flex justify-between mb-4 items-end">
                    <label className="text-sm font-bold text-surface-200">团队执行效率目标</label>
                    <span className="text-2xl font-mono font-bold text-accent-300">{(efficiency * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="1" max="2.5" step="0.1"
                    value={efficiency}
                    onChange={(e) => setEfficiency(Number(e.target.value))}
                    className="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-accent-500 hover:accent-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                  />
                  <div className="flex justify-between text-xs text-surface-500 mt-2 font-mono">
                    <span>100% (现状)</span>
                    <span>250% (最高)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Side */}
            <div className="bg-surface-900/50 border border-white/5 rounded-2xl p-8 md:p-12 relative flex flex-col justify-center h-full">
              <h3 className="text-surface-400 font-medium mb-2 uppercase tracking-widest text-sm">预估年度额外净利</h3>

              <AnimatePresence mode='wait'>
                <motion.div
                  key={recoveredProfit}
                  initial={{ opacity: 0.5, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-baseline gap-2 mb-8"
                >
                  <span className="text-6xl md:text-7xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-surface-400 tracking-tighter">
                    ¥{Math.round(recoveredProfit * 12).toLocaleString()}
                  </span>
                </motion.div>
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-surface-800/40 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-2 text-brand-300">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">成本挽回</span>
                  </div>
                  <div className="text-xl font-bold text-white">¥{Math.round((recoveredProfit * 0.45) * 12).toLocaleString()}</div>
                </div>
                <div className="bg-surface-800/40 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-2 text-accent-300">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">效率增益</span>
                  </div>
                  <div className="text-xl font-bold text-white">¥{Math.round((recoveredProfit * 0.55) * 12).toLocaleString()}</div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-brand-50 transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                生成详细 ROI 报告
              </motion.button>

              <p className="text-center text-surface-500 text-xs mt-4">
                *基于行业平均数据估算，仅供参考
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveROI;