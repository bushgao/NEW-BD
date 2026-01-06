import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-20 overflow-visible">

      {/* 1. Dynamic Background System (Local to Hero) */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {/* Grid Pattern - Light & Subtle */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="container mx-auto px-6 text-center z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-10 shadow-[0_0_15px_rgba(99,102,241,0.2)] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            <span className="text-xs text-brand-200 font-bold tracking-wide uppercase">Beta: 工厂与品牌方专用</span>
          </div>

          {/* H1 Headline */}
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-tight text-white drop-shadow-2xl">
            <span className="block mb-4 text-slate-500 text-3xl md:text-5xl decoration-4 decoration-red-500/50 line-through decoration-wavy opacity-70">
              Excel 混乱
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-white to-accent-300 pb-2">
              你的利润，算清了吗？
            </span>
          </h1>

          {/* Subheadline - Concise & Pain Point Driven */}
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            样品寄出了一堆，回款却算不明白？<br className="hidden md:block" />
            <span className="text-white font-bold">Zilo</span> 帮你把散落在微信和表格里的糊涂账，变成看得见的 <span className="text-brand-400 font-bold border-b-2 border-brand-500/30">真实 ROI</span>。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <motion.button
              onClick={() => navigate('/register')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl flex items-center gap-2 shadow-[0_0_40px_rgba(99,102,241,0.4)] overflow-hidden group border-0 cursor-pointer text-lg"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center gap-2">
                立即止损，开始管理
                <ArrowRight className="w-5 h-5" />
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 shadow-lg flex items-center gap-2 transition-all cursor-pointer backdrop-blur-sm"
            >
              <PlayCircle className="w-5 h-5 text-brand-300" />
              看产品演示
            </motion.button>
          </div>

          {/* Social Proof / Stats Ticker */}
          <div className="mt-20 pt-10 border-t border-white/5 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
              <div className="flex flex-col items-center md:items-start p-4 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="text-4xl font-black text-white mb-2">100%</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">样品追踪准确率</div>
              </div>
              <div className="flex flex-col items-center md:items-start p-4 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="text-4xl font-black text-white mb-2">2.5<span className="text-2xl text-slate-500 ml-1">h</span></div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">每天节省统计时间</div>
              </div>
              <div className="flex flex-col items-center md:items-start p-4 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2 text-4xl font-black text-brand-400 mb-2">
                  <TrendingUp className="w-8 h-8" />
                  <span>ROI</span>
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">只关注净利润</div>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
