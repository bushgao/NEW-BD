import React from 'react';
import { Database, Calculator, Truck } from 'lucide-react';

const FeatureHighlight: React.FC = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">

        {/* Feature 1: The Truth Source (A) */}
        <div className="flex flex-col lg:flex-row items-center gap-16 mb-32">
          <div className="lg:w-1/2">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <Database className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-6 text-white">
              唯一的 <span className="text-blue-400 underline decoration-4 decoration-blue-500/30">真相来源</span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              停止猜测。Zilo 是你 BD 团队的中央指挥部。
              自动将聊天记录、导入数据和手工录入整合成一条清晰的时间线。
            </p>
            <ul className="space-y-4">
              {['自动达人去重', '统一标签体系 (报价、类目、意向度)', '历史合作数据一目了然'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-xs text-blue-400 font-bold border border-blue-500/20">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2 relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl ring-1 ring-white/5">
              {/* Mock UI for Data Consolidation */}
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div className="font-bold text-slate-100">达人数据库</div>
                <div className="text-xs text-blue-300 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">刚刚同步</div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-700" />
                    <div className="flex-1">
                      <div className="h-2.5 w-24 bg-slate-600 rounded mb-2" />
                      <div className="h-2 w-16 bg-slate-700 rounded" />
                    </div>
                    <div className="text-xs px-2 py-1 bg-green-500/10 text-green-400 font-bold rounded border border-green-500/20">已验证</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Cost & Samples (C) */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16 mb-32">
          <div className="lg:w-1/2">
            <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-8 border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.15)]">
              <Truck className="w-7 h-7 text-pink-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-6 text-white">
              样品就是 <span className="text-pink-500 underline decoration-4 decoration-pink-500/30">真金白银</span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              工厂在无法追踪的样品上损失惨重。Zilo 追踪每一个寄出的单位：
              谁拿了？发视频了吗？收益能覆盖 COGS 吗？
            </p>
            <ul className="space-y-4">
              {['追踪 样品成本 vs 零售价', '状态流转：已寄出、已签收、已发布、已寄回', '按活动自动核算总成本'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                  <div className="w-6 h-6 rounded-full bg-pink-500/10 flex items-center justify-center text-xs text-pink-500 font-bold border border-pink-500/20">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2 relative group">
            <div className="absolute inset-0 bg-pink-500/20 blur-[80px] rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl ring-1 ring-white/5">
              {/* Mock UI for Sample Tracking */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                  <div className="text-3xl font-black text-slate-100">142</div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">寄出样品数</div>
                </div>
                <div className="bg-pink-500/10 p-4 rounded-xl text-center border border-pink-500/20">
                  <div className="text-3xl font-black text-pink-400">¥12,450</div>
                  <div className="text-xs text-pink-300 font-bold uppercase tracking-wider mt-1">总 COGS 成本</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-500 px-2">
                  <span>产品名称</span>
                  <span>当前状态</span>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center shadow-sm">
                  <span className="text-sm font-bold text-slate-200">光感面膜 X2</span>
                  <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded font-medium border border-yellow-500/20">运输中</span>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center shadow-sm">
                  <span className="text-sm font-bold text-slate-200">紧致精华套装</span>
                  <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded font-medium border border-green-500/20">视频已上线</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Real ROI (D) */}
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <Calculator className="w-7 h-7 text-purple-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-6 text-white">
              ROI 不仅仅是 GMV <br />它是 <span className="text-purple-500 underline decoration-4 decoration-purple-500/30">净利润</span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              别被虚荣指标欺骗。我们通过计入样品成本、运费、佣金和坑位费，帮你算出<strong>真实</strong>的回报率。
            </p>
            <ul className="space-y-4">
              {['单达人利润表 (P&L)', '团队人效与佣金对账', '盈亏平衡点分析'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-xs text-purple-500 font-bold border border-purple-500/20">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2">
            {/* Interactive ROI Widget Placeholder - Implemented in next component */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative overflow-hidden ring-1 ring-white/5 hover:ring-purple-500/50 transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <div className="absolute top-5 right-5 text-[10px] font-mono text-purple-300 border border-purple-500/30 px-2 py-1 rounded bg-purple-500/10">实时计算中</div>
              <div className="space-y-6 relative z-10">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">销售额 (GMV)</span>
                    <span className="text-white font-bold text-lg">¥50,000</span>
                  </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-full animate-pulse"></div>
                  </div>
                </div>

                <div className="pl-4 border-l-2 border-slate-700/50 space-y-4">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500">佣金支出 (20%)</span>
                    <span className="text-red-400 font-mono">-¥10,000</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500">样品成本 (COGS)</span>
                    <span className="text-red-400 font-mono">-¥500</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500">物流履约</span>
                    <span className="text-red-400 font-mono">-¥200</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-700/50">
                  <div className="flex justify-between items-end">
                    <span className="text-slate-300 font-medium">真实净利 (Net Profit)</span>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">¥39,300</span>
                  </div>
                  <div className="text-right text-xs text-brand-400 font-bold mt-2">ROI: 3.8x</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FeatureHighlight;