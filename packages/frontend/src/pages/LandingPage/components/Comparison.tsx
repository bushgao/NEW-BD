import React from 'react';
import { Check, X } from 'lucide-react';

const Comparison: React.FC = () => {
  const features = [
    { name: "核心痛点解决", zilo: "全流程闭环 (寄样-回收-利润)", others: "仅提供达人查找, 无执行管理" },
    { name: "样品管理", zilo: "单件级追踪 & 自动催还", others: "靠 Excel 手动记录, 极易丢失" },
    { name: "ROI 计算", zilo: "净利润 (含隐形成本)", others: "仅 GMV (虚荣指标)" },
    { name: "团队协作", zilo: "多人实时同步, 权限分级", others: "文件传输, 版本混乱" },
    { name: "数据沉淀", zilo: "私有达人库, 永久资产", others: "员工离职, 数据带走" },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            为什么选择 <span className="text-brand-400">Zilo</span> ?
          </h2>
          <p className="text-slate-400 text-lg">
            不要为了"找达人"买工具，要为了"赚到钱"买系统。
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-1 overflow-hidden shadow-2xl ring-1 ring-white/5">
            <div className="grid grid-cols-3 bg-white/5 border-b border-white/5 p-4 text-center items-center">
              <div className="font-bold text-slate-400 text-sm uppercase tracking-wider">功能对比</div>
              <div className="font-black text-2xl text-white flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                Zilo
              </div>
              <div className="font-bold text-slate-500">传统/其他工具</div>
            </div>

            <div className="divide-y divide-white/5">
              {features.map((item, idx) => (
                <div key={idx} className="grid grid-cols-3 p-6 items-center hover:bg-white/5 transition-colors">
                  <div className="text-slate-300 font-bold md:pl-8 text-sm md:text-base">{item.name}</div>

                  <div className="text-center relative">
                    <div className="absolute inset-0 bg-brand-500/5 -mx-6 -my-6 hidden md:block" />
                    <div className="relative text-brand-300 font-bold flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center mb-1 border border-brand-500/30">
                        <Check className="w-5 h-5 text-brand-400" />
                      </div>
                      <span className="text-sm md:text-base shadow-brand-500/50">{item.zilo}</span>
                    </div>
                  </div>

                  <div className="text-center text-slate-500 font-medium flex flex-col items-center gap-1 opacity-70">
                    <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center mb-1 border border-slate-600/30">
                      <X className="w-5 h-5 text-slate-500" />
                    </div>
                    <span className="text-sm md:text-base decoration-slate-600/50">{item.others}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Comparison;