import React from 'react';
import HeroBackground from './HeroBackground';
import DynamicDemo from './DynamicDemo';
import { ArrowRight, ChevronRight } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-white">
      <HeroBackground />
      
      <div className="container mx-auto px-6 relative z-10 pt-20 pb-16 lg:pt-0">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left: Copy */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              V2.0 更新：智能冲突检测上线
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
              寄了50份样品，<br />
              有几个<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">真正带货了？</span>
            </h1>
            
            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              不缺达人，缺的是算清账的系统。Zilo 让每一笔投入都透明可控，告别 Excel 混乱管理与内部撞单内耗。
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 group shadow-md hover:shadow-lg">
                立即开始免费试用
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                预约产品演示
              </button>
            </div>
            
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <img key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" src={`https://picsum.photos/32/32?random=${i}`} alt="user" />
                ))}
              </div>
              <p>已有 500+ 品牌通过 Zilo 提升 ROI</p>
            </div>
          </div>

          {/* Right: Dynamic Demo */}
          <div className="flex-1 w-full max-w-md lg:max-w-full">
            <div className="relative">
              {/* Glow effect behind - adjusted for light mode */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-100 blur-3xl rounded-full opacity-60 pointer-events-none"></div>
              
              <DynamicDemo />
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur border border-slate-200 p-4 rounded-xl shadow-sm">
                  <div className="text-2xl font-bold text-slate-900 mb-1">70%</div>
                  <div className="text-xs text-slate-500">效率提升</div>
                </div>
                <div className="bg-white/80 backdrop-blur border border-slate-200 p-4 rounded-xl shadow-sm">
                  <div className="text-2xl font-bold text-slate-900 mb-1">¥0</div>
                  <div className="text-xs text-slate-500">重复寄样亏损</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-slate-400">
        <ChevronRight className="rotate-90" />
      </div>
    </div>
  );
};

export default Hero;