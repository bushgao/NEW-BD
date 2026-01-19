import React from 'react';
import { ShieldCheck, BarChart3 } from 'lucide-react';

const FeatureHighlight: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="container mx-auto px-6 space-y-32">
        
        {/* Feature 1: Conflict Detection */}
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">冲突检测盾</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              系统自动识别重复录入的达人。当团队成员尝试联系已被跟进的达人时，系统会立即发出“撞单警告”，强制阻断重复寄样。
            </p>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                通过主页链接/ID唯一识别
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                保护期设置，避免恶意抢单
              </li>
            </ul>
          </div>
          <div className="flex-1 w-full">
            <div className="relative aspect-video rounded-xl bg-gradient-to-br from-slate-100 to-white border border-slate-200 p-8 shadow-xl overflow-hidden group">
               {/* Abstract UI Representation */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-2/3 bg-white rounded-lg border border-slate-200 p-4 flex flex-col gap-3 shadow-md group-hover:scale-105 transition-transform duration-500">
                  <div className="h-4 w-1/3 bg-slate-100 rounded"></div>
                  <div className="h-2 w-full bg-slate-50 rounded"></div>
                  <div className="h-2 w-2/3 bg-slate-50 rounded"></div>
                  
                  {/* The Shield Popup */}
                  <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white border border-red-200 p-4 rounded-lg shadow-xl flex flex-col items-center animate-pulse-slow">
                        <ShieldCheck className="text-red-500 mb-2" size={32} />
                        <div className="h-2 w-24 bg-red-100 rounded"></div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Feature 2: ROI Tracking */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 border border-cyan-100">
              <BarChart3 size={28} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">全链路 ROI 追踪</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              从寄出样品的那一刻起，自动追踪物流签收状态、达人发帖情况以及最终带货数据。每一分钱的去向都清晰可见。
            </p>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                物流状态自动同步
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                发帖回填与数据抓取
              </li>
            </ul>
          </div>
          <div className="flex-1 w-full">
            <div className="relative aspect-video rounded-xl bg-gradient-to-bl from-slate-100 to-white border border-slate-200 p-8 shadow-xl overflow-hidden group">
                {/* Abstract Graph */}
                <div className="absolute inset-0 flex items-end justify-between px-12 pb-12 pt-24 gap-4">
                    <div className="w-full bg-indigo-100 h-[40%] rounded-t-sm group-hover:h-[60%] transition-all duration-700 delay-100"></div>
                    <div className="w-full bg-indigo-200 h-[60%] rounded-t-sm group-hover:h-[80%] transition-all duration-700 delay-200"></div>
                    <div className="w-full bg-indigo-300 h-[30%] rounded-t-sm group-hover:h-[50%] transition-all duration-700 delay-300"></div>
                    <div className="w-full bg-cyan-500 h-[75%] rounded-t-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:h-[95%] transition-all duration-700 delay-400"></div>
                </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FeatureHighlight;