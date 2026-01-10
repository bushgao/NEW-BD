import { useState } from 'react';
import { Layers, ArrowRight } from 'lucide-react';
import Hero from './components/Hero';
import PainPoints from './components/PainPoints';
import FeatureHighlight from './components/FeatureHighlight';
import InteractiveROI from './components/InteractiveROI';
import Comparison from './components/Comparison';
import Footer from './components/Footer';
import RoleSelectModal from './components/RoleSelectModal';

const LandingPage = () => {
  const [showRoleModal, setShowRoleModal] = useState(false);

  const handleLoginClick = () => {
    setShowRoleModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-surface-950 text-white selection:bg-brand-500 selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-surface-950/80 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 glass-panel rounded-xl">
              <Layers className="w-5 h-5 text-brand-400" />
            </div>
            <span className="text-xl font-display font-bold text-white tracking-tight">Zilo</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={handleLoginClick}
              className="text-surface-300 hover:text-white transition-colors text-sm font-bold hidden md:block border-0 bg-transparent cursor-pointer"
            >
              登录
            </button>
            <button
              onClick={handleLoginClick}
              className="bg-white hover:bg-brand-50 text-black px-5 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 border-0 cursor-pointer"
            >
              免费试用
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow relative">
        {/* Global Noise Overlay */}
        <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

        <div className="relative z-10">
          <Hero />
          <PainPoints />
          <FeatureHighlight />
          <InteractiveROI />
          <Comparison />
        </div>

        {/* Final CTA */}
        <section className="py-40 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-radial from-brand-900/40 to-surface-950 pointer-events-none" />

          <div className="container mx-auto px-6 relative z-10">
            <h2 className="text-5xl md:text-7xl font-display font-black text-white mb-8 leading-tight tracking-tight">
              准备好开启 <br />
              <span className="text-gradient from-brand-400 to-accent-400">利润增长吗？</span>
            </h2>
            <p className="text-surface-300 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light">
              加入那些已经告别 "Excel 混乱"，拥抱 "确定性增长" 的领先品牌。
            </p>
            <button
              onClick={handleLoginClick}
              className="inline-flex items-center gap-2 px-10 py-5 bg-white text-black font-bold text-lg rounded-full hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] border-0 cursor-pointer group"
            >
              立即免费开始
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
      </main>

      <Footer />

      {/* 角色选择弹窗 */}
      <RoleSelectModal
        open={showRoleModal}
        onClose={() => setShowRoleModal(false)}
      />
    </div>
  );
};

export default LandingPage;

