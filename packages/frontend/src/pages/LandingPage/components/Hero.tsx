import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Star, Zap, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden perspective-1000">

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-[128px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-glow/20 rounded-full blur-[128px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-8 hover:bg-surface-800/50 transition-colors cursor-default"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            <span className="text-xs font-bold tracking-widest text-brand-200 uppercase">Google Labs 启发设计</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-9xl font-display font-black tracking-tighter text-white mb-8 leading-[0.9]"
          >
            掌控达人营销的 <br />
            <span className="text-gradient-brand">确定性增长</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-surface-300 max-w-2xl mx-auto mb-12 font-light leading-relaxed"
          >
            不再在这个充满 <span className="text-white font-medium">Excel 混乱</span> 的宇宙中迷失。
            <br />
            Zilo 将您的达人营销数据转化为纯净的利润透视图。
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <button
              onClick={() => navigate('/register')}
              className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-full overflow-hidden hover:scale-105 transition-transform duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-200 to-accent-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                立即开始
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <button
              className="group px-8 py-4 bg-surface-800/80 border border-surface-600/50 rounded-full text-white font-medium text-lg hover:bg-surface-700/80 hover:border-surface-500/50 transition-all flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
                <Play className="w-4 h-4 fill-current ml-0.5 text-brand-400 group-hover:text-white" />
              </div>
              <span className="text-surface-100">观看演示</span>
            </button>
          </motion.div>

        </div>

        {/* Floating Cards (Decorative) */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10 hidden md:block">
          <FloatingCard
            icon={<Zap className="text-yellow-400" />}
            label="执行效率"
            value="+128%"
            className="top-1/4 left-[10%] animation-delay-2000"
          />
          <FloatingCard
            icon={<Activity className="text-brand-400" />}
            label="活跃线索"
            value="8,240"
            className="bottom-1/3 right-[10%]"
          />
          <FloatingCard
            icon={<Star className="text-accent-400" />}
            label="平均转化率"
            value="4.8%"
            className="top-1/3 right-[20%] delay-1000"
          />
        </div>
      </div>
    </section>
  );
};

const FloatingCard = ({ icon, label, value, className = "" }: { icon: React.ReactNode, label: string, value: string, className?: string }) => (
  <motion.div
    animate={{ y: [0, -20, 0] }}
    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    className={`absolute p-4 glass-panel rounded-2xl flex items-center gap-4 w-48 ${className}`}
  >
    <div className="p-2 bg-surface-800/50 rounded-lg">
      {icon}
    </div>
    <div>
      <div className="text-xs text-surface-400 uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold text-white tabular-nums">{value}</div>
    </div>
  </motion.div>
);

export default Hero;
