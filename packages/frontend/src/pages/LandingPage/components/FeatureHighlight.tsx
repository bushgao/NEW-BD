import React from 'react';
import { motion } from 'framer-motion';
import { Database, Calculator, Truck, Check } from 'lucide-react';

const FeatureHighlight: React.FC = () => {
  return (
    <section className="py-32 relative overflow-hidden bg-surface-950">
      <div className="container mx-auto px-6 relative z-10">

        {/* Feature 1: The Truth Source */}
        <div className="flex flex-col lg:flex-row items-center gap-20 mb-40">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2"
          >
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-8 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-4xl font-display font-bold mb-6 text-white leading-tight">
              唯一的 <span className="text-gradient from-blue-400 to-indigo-400">真相来源</span>
            </h2>
            <p className="text-lg text-surface-300 mb-8 leading-relaxed">
              停止猜测。Zilo 是你 BD 团队的中央指挥部。
              自动将聊天记录、导入数据和手工录入整合成一条清晰的时间线，让团队协作无缝衔接。
            </p>
            <ul className="space-y-4">
              {['自动达人去重 & 冲突检测', '统一标签体系 (报价、类目、意向度)', '历史合作数据一目了然'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-surface-200 font-medium">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-xs text-blue-400 border border-blue-500/20">
                    <Check className="w-3 h-3" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:w-1/2 relative group perspective-1000"
          >
            <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full opacity-50" />

            {/* Glass UI Mockup */}
            <div className="glass-panel p-6 rounded-2xl relative transform transition-transform group-hover:rotate-y-2 duration-700">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="font-bold text-white">达人数据库</div>
                <div className="text-[10px] text-blue-300 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">实时同步</div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 bg-surface-800/40 p-3 rounded-xl border border-white/5 hover:bg-surface-700/40 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-surface-700 to-surface-600" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-24 bg-surface-600 rounded-full" />
                      <div className="h-1.5 w-16 bg-surface-700 rounded-full" />
                    </div>
                    <div className="text-xs px-2 py-1 bg-green-500/10 text-green-400 font-bold rounded border border-green-500/20">已验证</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature 2: Cost & Samples */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-20 mb-40">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2"
          >
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-8 border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.1)]">
              <Truck className="w-6 h-6 text-pink-500" />
            </div>
            <h2 className="text-4xl font-display font-bold mb-6 text-white leading-tight">
              样品就是 <span className="text-gradient from-pink-400 to-rose-400">真金白银</span>
            </h2>
            <p className="text-lg text-surface-300 mb-8 leading-relaxed">
              工厂在无法追踪的样品上损失惨重。Zilo 追踪每一个寄出的单位：
              谁拿了？发视频了吗？收益能覆盖 COGS 吗？全流程闭环监控。
            </p>
            <ul className="space-y-4">
              {['追踪 样品成本 vs 零售价', '状态流转：寄出 -> 签收 -> 发布 -> 寄回', '按活动自动核算总成本'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-surface-200 font-medium">
                  <div className="w-5 h-5 rounded-full bg-pink-500/10 flex items-center justify-center text-xs text-pink-500 border border-pink-500/20">
                    <Check className="w-3 h-3" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:w-1/2 relative group perspective-1000"
          >
            <div className="absolute inset-0 bg-pink-500/10 blur-[100px] rounded-full opacity-50" />
            <div className="glass-panel p-6 rounded-2xl relative transform transition-transform group-hover:rotate-y-[-2deg] duration-700">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-800/40 p-4 rounded-xl text-center border border-white/5">
                  <div className="text-3xl font-black text-white">142</div>
                  <div className="text-[10px] text-surface-400 font-bold uppercase tracking-wider mt-1">寄出样品数</div>
                </div>
                <div className="bg-pink-500/10 p-4 rounded-xl text-center border border-pink-500/20">
                  <div className="text-3xl font-black text-pink-400">¥12k</div>
                  <div className="text-[10px] text-pink-300 font-bold uppercase tracking-wider mt-1">总 COGS 成本</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-surface-800/40 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                  <span className="text-sm font-bold text-surface-200">光感面膜 X2</span>
                  <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20">运输中</span>
                </div>
                <div className="bg-surface-800/40 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                  <span className="text-sm font-bold text-surface-200">紧致精华套装</span>
                  <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">视频已上线</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature 3: Real ROI */}
        <div className="flex flex-col lg:flex-row items-center gap-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2"
          >
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-8 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
              <Calculator className="w-6 h-6 text-purple-500" />
            </div>
            <h2 className="text-4xl font-display font-bold mb-6 text-white leading-tight">
              ROI 不仅仅是 GMV <br />它是 <span className="text-gradient from-purple-400 to-violet-400">净利润</span>
            </h2>
            <p className="text-lg text-surface-300 mb-8 leading-relaxed">
              别被虚荣指标欺骗。我们通过计入样品成本、运费、佣金和坑位费，帮你算出<strong>真实</strong>的回报率。
              每一分投入，都算得清清楚楚。
            </p>
            <ul className="space-y-4">
              {['单达人利润表 (P&L)', '团队人效与佣金对账', '盈亏平衡点自动计算'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-surface-200 font-medium">
                  <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center text-xs text-purple-500 border border-purple-500/20">
                    <Check className="w-3 h-3" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:w-1/2"
          >
            {/* Interactive Widget */}
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-purple-500/30 transition-colors duration-700" />

              <div className="absolute top-5 right-5 text-[10px] font-mono text-purple-300 border border-purple-500/30 px-2 py-1 rounded bg-purple-500/10">实时利润分析 (P&L)</div>

              <div className="space-y-6 relative z-10 pt-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-surface-400">销售额 (GMV)</span>
                    <span className="text-white font-bold text-lg">¥50,000</span>
                  </div>
                  <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-full animate-pulse"></div>
                  </div>
                </div>

                <div className="pl-4 border-l-2 border-surface-700 space-y-4">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-surface-500">佣金支出 (20%)</span>
                    <span className="text-red-400 font-mono">-¥10,000</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-surface-500">样品成本 (COGS)</span>
                    <span className="text-red-400 font-mono">-¥500</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <div className="flex justify-between items-end">
                    <span className="text-surface-300 font-medium">真实净利</span>
                    <span className="text-3xl font-black text-gradient from-brand-400 to-purple-400">¥39,300</span>
                  </div>
                  <div className="text-right text-xs text-brand-400 font-bold mt-2">ROI: 3.8x</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default FeatureHighlight;