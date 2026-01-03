import React from 'react';
import { Check, X } from 'lucide-react';

const Comparison: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black mb-4 text-slate-900">为什么选择 Zilo?</h2>
          <p className="text-slate-600 text-lg">我们不与蝉妈妈等数据平台竞争。我们是工作流的完美补充。</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Public Data Platforms */}
          <div className="p-8 rounded-3xl border border-slate-200 bg-white opacity-80 hover:opacity-100 transition-all shadow-sm">
            <h3 className="text-xl font-bold text-slate-500 mb-2">公共数据平台 (如蝉妈妈/飞瓜)</h3>
            <p className="text-sm text-slate-400 mb-8 font-medium">"我该找谁合作？"</p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-slate-600">市场大盘趋势</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-slate-600">竞品分析</span>
              </li>
              <li className="flex items-center gap-3 opacity-50">
                <X className="w-5 h-5 text-red-400" />
                <span className="text-slate-400">内部样品追踪</span>
              </li>
              <li className="flex items-center gap-3 opacity-50">
                <X className="w-5 h-5 text-red-400" />
                <span className="text-slate-400">真实利润核算</span>
              </li>
              <li className="flex items-center gap-3 opacity-50">
                <X className="w-5 h-5 text-red-400" />
                <span className="text-slate-400">团队协作管理</span>
              </li>
            </ul>
          </div>

          {/* Kiro / Zilo */}
          <div className="p-8 rounded-3xl border-2 border-brand-500 bg-white relative shadow-2xl shadow-brand-500/10 transform md:-translate-y-4">
            <div className="absolute top-0 right-0 bg-brand-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-xl">
              专为执行设计
            </div>
            <h3 className="text-2xl font-black text-brand-600 mb-2">Zilo 系统</h3>
            <p className="text-sm text-brand-400 mb-8 font-bold">"我们赚到钱了吗？"</p>
            <ul className="space-y-5">
              <li className="flex items-center gap-3">
                <div className="p-1 bg-brand-100 rounded-full"><Check className="w-4 h-4 text-brand-600" /></div>
                <span className="text-slate-800 font-bold">企业内部资产管理</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1 bg-brand-100 rounded-full"><Check className="w-4 h-4 text-brand-600" /></div>
                <span className="text-slate-800 font-bold">样品成本与物流管控</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1 bg-brand-100 rounded-full"><Check className="w-4 h-4 text-brand-600" /></div>
                <span className="text-slate-800 font-bold">净利润 ROI 计算器</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1 bg-brand-100 rounded-full"><Check className="w-4 h-4 text-brand-600" /></div>
                <span className="text-slate-800 font-bold">团队协作工作流引擎</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1 bg-brand-100 rounded-full"><Check className="w-4 h-4 text-brand-600" /></div>
                <span className="text-slate-800 font-bold">私有达人 CRM</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Comparison;