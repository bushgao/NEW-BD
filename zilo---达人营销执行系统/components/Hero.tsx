import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, TrendingUp, X } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-32 bg-white selection:bg-brand-500 selection:text-white">
      
      {/* 1. Dynamic Background System */}
      <div className="absolute inset-0 z-0">
         {/* Grid Pattern */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
         
         {/* Animated Orbs */}
         <motion.div 
            animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-brand-100/40 rounded-full blur-[120px] mix-blend-multiply" 
         />
         <motion.div 
            animate={{ x: [0, -30, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-20 right-0 w-[600px] h-[600px] bg-purple-100/40 rounded-full blur-[100px] mix-blend-multiply" 
         />
         <motion.div 
            animate={{ x: [0, 40, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute -bottom-32 left-20 w-[600px] h-[600px] bg-cyan-100/40 rounded-full blur-[100px] mix-blend-multiply" 
         />
      </div>

      <div className="container mx-auto px-6 text-center z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 mb-10 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            <span className="text-xs text-slate-500 font-bold tracking-wide uppercase">Beta: 工厂与品牌方专用</span>
          </div>

          {/* H1 Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1] text-slate-900">
            <span className="block mb-2 text-slate-300 decoration-4 decoration-red-400/50 line-through decoration-wavy">
              Excel 混乱
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600 drop-shadow-sm">
               你的利润，算清了吗？
            </span>
          </h1>

          {/* Subheadline - Concise & Pain Point Driven */}
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            样品寄出了一堆，回款却算不明白？<br className="hidden md:block"/>
            <span className="text-slate-900 font-bold">Zilo</span> 帮你把散落在微信和表格里的糊涂账，变成看得见的 <span className="text-brand-600 font-bold border-b-2 border-brand-200">真实 ROI</span>。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <motion.a
              href="http://localhost:5173/register"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative px-8 py-4 bg-brand-600 text-white font-bold rounded-2xl flex items-center gap-2 shadow-xl shadow-brand-500/20 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center gap-2">
                立即止损，开始管理
                <ArrowRight className="w-5 h-5" />
              </span>
            </motion.a>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 transition-colors"
            >
              <PlayCircle className="w-5 h-5 text-slate-400" />
              看产品演示
            </motion.button>
          </div>

          {/* Social Proof / Stats Ticker */}
          <div className="mt-16 pt-8 border-t border-slate-100 max-w-4xl mx-auto">
             <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
                <div className="flex flex-col items-center sm:items-start">
                   <div className="text-3xl font-black text-slate-900">100%</div>
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">样品追踪准确率</div>
                </div>
                <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
                <div className="flex flex-col items-center sm:items-start">
                   <div className="text-3xl font-black text-slate-900">2.5<span className="text-lg">h</span></div>
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">每天节省统计时间</div>
                </div>
                <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
                 <div className="flex flex-col items-center sm:items-start">
                   <div className="flex items-center gap-1 text-3xl font-black text-brand-600">
                     <TrendingUp className="w-6 h-6" />
                     <span>ROI</span>
                   </div>
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">只关注净利润</div>
                </div>
             </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
};

export default Hero;