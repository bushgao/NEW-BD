import React from 'react';
import { Database, Calculator, Truck } from 'lucide-react';

const FeatureHighlight: React.FC = () => {
  return (
    <section className="py-32 relative overflow-hidden bg-white">
      <div className="container mx-auto px-6">
        
        {/* Feature 1: The Truth Source (A) */}
        <div className="flex flex-col lg:flex-row items-center gap-16 mb-32">
          <div className="lg:w-1/2">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-8">
              <Database className="w-7 h-7 text-brand-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-6 text-slate-900">
              唯一的 <span className="text-brand-600 underline decoration-4 decoration-blue-200">真相来源</span>
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              停止猜测。Zilo 是你 BD 团队的中央指挥部。
              自动将聊天记录、导入数据和手工录入整合成一条清晰的时间线。
            </p>
            <ul className="space-y-4">
              {['自动达人去重', '统一标签体系 (报价、类目、意向度)', '历史合作数据一目了然'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-xs text-brand-600 font-bold border border-blue-100">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2 relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-100 blur-3xl rounded-full opacity-60" />
             <div className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
                {/* Mock UI for Data Consolidation */}
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                   <div className="font-bold text-slate-800">达人数据库</div>
                   <div className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">刚刚同步</div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                       <div className="w-10 h-10 rounded-full bg-slate-200" />
                       <div className="flex-1">
                          <div className="h-2.5 w-24 bg-slate-300 rounded mb-2" />
                          <div className="h-2 w-16 bg-slate-200 rounded" />
                       </div>
                       <div className="text-xs px-2 py-1 bg-green-100 text-green-700 font-bold rounded">已验证</div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>

        {/* Feature 2: Cost & Samples (C) */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16 mb-32">
          <div className="lg:w-1/2">
            <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mb-8">
              <Truck className="w-7 h-7 text-pink-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-6 text-slate-900">
              样品就是 <span className="text-pink-500 underline decoration-4 decoration-pink-200">真金白银</span>
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              工厂在无法追踪的样品上损失惨重。Zilo 追踪每一个寄出的单位：
              谁拿了？发视频了吗？收益能覆盖 COGS 吗？
            </p>
            <ul className="space-y-4">
              {['追踪 样品成本 vs 零售价', '状态流转：已寄出、已签收、已发布、已寄回', '按活动自动核算总成本'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-pink-50 flex items-center justify-center text-xs text-pink-500 font-bold border border-pink-100">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2 relative">
             <div className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
                {/* Mock UI for Sample Tracking */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                      <div className="text-3xl font-black text-slate-800">142</div>
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">寄出样品数</div>
                   </div>
                   <div className="bg-pink-50 p-4 rounded-xl text-center border border-pink-100">
                      <div className="text-3xl font-black text-pink-600">¥12,450</div>
                      <div className="text-xs text-pink-400 font-bold uppercase tracking-wider mt-1">总 COGS 成本</div>
                   </div>
                </div>
                <div className="space-y-3">
                   <div className="flex justify-between text-xs font-bold text-slate-400 px-2">
                      <span>产品名称</span>
                      <span>当前状态</span>
                   </div>
                   <div className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center shadow-sm">
                      <span className="text-sm font-bold text-slate-700">光感面膜 X2</span>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-medium">运输中</span>
                   </div>
                   <div className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center shadow-sm">
                      <span className="text-sm font-bold text-slate-700">紧致精华套装</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">视频已上线</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Feature 3: Real ROI (D) */}
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-8">
              <Calculator className="w-7 h-7 text-purple-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-6 text-slate-900">
              ROI 不仅仅是 GMV <br/>它是 <span className="text-purple-600 underline decoration-4 decoration-purple-200">净利润</span>
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              别被虚荣指标欺骗。我们通过计入样品成本、运费、佣金和坑位费，帮你算出<strong>真实</strong>的回报率。
            </p>
            <ul className="space-y-4">
              {['单达人利润表 (P&L)', '团队人效与佣金对账', '盈亏平衡点分析'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-xs text-purple-600 font-bold border border-purple-100">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2">
            {/* Interactive ROI Widget Placeholder - Implemented in next component */}
             <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
                
                <div className="absolute top-5 right-5 text-[10px] font-mono text-purple-300 border border-purple-500/30 px-2 py-1 rounded bg-purple-500/10">实时计算中</div>
                <div className="space-y-6 relative z-10">
                   <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">销售额 (GMV)</span>
                        <span className="text-white font-bold text-lg">¥50,000</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-full"></div>
                      </div>
                   </div>
                   
                   <div className="pl-4 border-l-2 border-slate-700 space-y-4">
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

                   <div className="pt-6 border-t border-slate-700">
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