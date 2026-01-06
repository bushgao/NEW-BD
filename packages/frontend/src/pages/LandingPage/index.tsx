import { useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import Hero from './components/Hero';
import PainPoints from './components/PainPoints';
import FeatureHighlight from './components/FeatureHighlight';
import InteractiveROI from './components/InteractiveROI';
import Comparison from './components/Comparison';
import Footer from './components/Footer';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0f172a] text-slate-50 selection:bg-brand-500 selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-slate-900/50 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-brand-600 to-accent-600 rounded-xl shadow-lg shadow-brand-500/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight leading-none pt-0.5">Zilo</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/login')}
              className="text-slate-300 hover:text-white transition-colors text-sm font-bold hidden md:block border-0 bg-transparent cursor-pointer"
            >
              登录
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-white hover:bg-slate-100 text-brand-900 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:-translate-y-0.5 border-0 cursor-pointer"
            >
              免费试用
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow relative">
        {/* Global Noise Overlay */}
        <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

        {/* Deep Space Background Gradients */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-900/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-900/20 blur-[120px]" />
        </div>

        <div className="relative z-10">
          <Hero />
          <PainPoints />
          <FeatureHighlight />
          <InteractiveROI />
          <Comparison />
        </div>

        {/* Final CTA */}
        <section className="py-32 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-900/50" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />

          <div className="container mx-auto px-6 relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight tracking-tight">
              把影响力转化为库存？<br />
              不，我们要转化为 <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-accent-300">净利润</span>。
            </h2>
            <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium">
              加入那些已经告别 "Excel 混乱"，拥抱 "执行透明化" 的先进工厂与品牌。
            </p>
            <button
              onClick={() => navigate('/register')}
              className="inline-block px-10 py-5 bg-white text-brand-950 font-bold text-lg rounded-2xl hover:bg-slate-100 transition-all transform hover:-translate-y-1 shadow-[0_0_40px_rgba(255,255,255,0.2)] border-0 cursor-pointer"
            >
              开始免费试用
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
