import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp } from 'lucide-react';

const InteractiveROI: React.FC = () => {
  const [investment, setInvestment] = useState(50000);
  const [profitMargin, setProfitMargin] = useState(25);
  const [efficiency, setEfficiency] = useState(1); // 1 = 100%

  const [lostProfit, setLostProfit] = useState(0);
  const [recoveredProfit, setRecoveredProfit] = useState(0);

  useEffect(() => {
    // Mock calculation logic
    // Assume Zilo helps recover 15% of waste + efficiency boost
    const baseWaste = investment * 0.2; // 20% waste in samples/hidden costs
    const recovered = baseWaste * 0.6 * efficiency;
    setLostProfit(baseWaste);
    setRecoveredProfit(recovered * 1.5); // Multiplier for efficiency gain
  }, [investment, profitMargin, efficiency]);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl ring-1 ring-white/5">
          <div className="grid lg:grid-cols-2 gap-16">

            {/* Controls */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 text-xs font-bold border border-brand-500/20 mb-6">
                <Calculator className="w-4 h-4" />
                <span>ROI 计算器</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-6 text-white">
                你的钱到底 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">
                  漏掉了多少？
                </span>
              </h2>
              <p className="text-slate-400 mb-10">
                拖动下方滑块，看看使用 Zilo 系统化管理后，你能从混乱中挽回多少净利润。
              </p>

              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-4">
                    <label className="text-sm font-bold text-slate-300">月度 推广预算投入</label>
                    <span className="text-brand-300 font-mono font-bold">¥{investment.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="10000" max="500000" step="5000"
                    value={investment}
                    onChange={(e) => setInvestment(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500 hover:accent-brand-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-4">
                    <label className="text-sm font-bold text-slate-300">团队 执行效率提升</label>
                    <span className="text-brand-300 font-mono font-bold">{(efficiency * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="1" max="2" step="0.1"
                    value={efficiency}
                    onChange={(e) => setEfficiency(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500 hover:accent-brand-400"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>现状 (100%)</span>
                    <span>Zilo 加持 (200%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Display */}
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500/20 blur-[100px] rounded-full opacity-40" />
              <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
                <h3 className="text-slate-300 font-bold mb-8">预估每年挽回利润</h3>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl md:text-6xl font-black text-white tracking-tight">
                    ¥{Math.round(recoveredProfit * 12).toLocaleString()}
                  </span>
                  <span className="text-green-400 font-bold text-sm bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                    +{(recoveredProfit * 12 / investment * 10).toFixed(1)}% 净利提升
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-10">
                  *基于平均达人样品回收率和人效提升数据估算
                </p>

                <div className="space-y-4">
                  <motion.div
                    key={investment}
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    className="bg-slate-800/50 rounded-lg p-4 border border-white/5"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-400">样品损耗节省</span>
                      <span className="text-white font-mono">¥{Math.round(recoveredProfit * 0.4 * 12).toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '40%' }}
                        transition={{ duration: 1 }}
                        className="h-full bg-blue-500"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    key={efficiency}
                    viewport={{ once: true }}
                    className="bg-slate-800/50 rounded-lg p-4 border border-white/5"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-400">人效提升产出</span>
                      <span className="text-white font-mono">¥{Math.round(recoveredProfit * 0.6 * 12).toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '60%' }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-purple-500"
                      />
                    </div>
                  </motion.div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                  <button className="w-full py-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold transition-all shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.6)] flex items-center justify-center gap-2 group">
                    <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    获取详细 ROI 分析报告
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveROI;