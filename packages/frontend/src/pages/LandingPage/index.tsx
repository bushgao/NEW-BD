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
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-600 rounded-xl shadow-lg shadow-brand-500/30">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">Zilo</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/login')}
              className="text-slate-600 hover:text-brand-600 transition-colors text-sm font-bold hidden md:block border-0 bg-transparent cursor-pointer"
            >
              登录
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 border-0 cursor-pointer"
            >
              免费试用
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <Hero />
        <PainPoints />
        <FeatureHighlight />
        <InteractiveROI />
        <Comparison />
        
        {/* Final CTA */}
        <section className="py-32 bg-brand-600 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-500 to-brand-700 opacity-50" />
          
          <div className="container mx-auto px-6 relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-8 leading-tight">
              把影响力转化为库存？<br/> 
              不，我们要转化为 <span className="text-brand-200">净利润</span>。
            </h2>
            <p className="text-brand-100 text-lg mb-12 max-w-2xl mx-auto font-medium">
              加入那些已经告别 "Excel 混乱"，拥抱 "执行透明化" 的先进工厂与品牌。
            </p>
            <button
              onClick={() => navigate('/register')}
              className="inline-block px-10 py-5 bg-white text-brand-700 font-bold text-lg rounded-2xl hover:bg-brand-50 transition-all transform hover:-translate-y-1 shadow-2xl shadow-black/20 border-0 cursor-pointer"
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
