import React from 'react';
import Hero from './components/Hero';
import PainPoints from './components/PainPoints';
import FeatureHighlight from './components/FeatureHighlight';
import Comparison from './components/Comparison';
import Footer from './components/Footer';

function App() {
  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation - Light mode */}
      <nav className="absolute top-0 left-0 w-full z-50 px-6 py-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-slate-900 tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-mono font-bold">Z</span>
            </div>
            ilo
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-slate-900 transition-colors">功能</a>
            <a href="#" className="hover:text-slate-900 transition-colors">客户案例</a>
            <a href="#" className="hover:text-slate-900 transition-colors">价格</a>
          </div>
          <button className="px-4 py-2 bg-white text-slate-900 text-sm font-medium rounded border border-slate-200 hover:bg-slate-50 transition-colors">
            登录
          </button>
        </div>
      </nav>

      <Hero />
      <PainPoints />
      <FeatureHighlight />
      <Comparison />
      
      {/* Final CTA Section - Light gradient */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-indigo-50">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">准备好清理你的寄样账单了吗？</h2>
            <p className="text-slate-600 max-w-xl mx-auto mb-10 text-lg">
                加入 500+ 品牌，使用 Zilo 提升 70% 的工作效率。
            </p>
            <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all hover:scale-105 shadow-xl shadow-indigo-200">
                免费试用 14 天
            </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default App;