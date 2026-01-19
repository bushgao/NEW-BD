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
        // Global text color boosted from default to slate-700/900 for legibility
        <div className="min-h-screen flex flex-col font-sans bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
            {/* Navigation - Light Mode */}
            <nav className="fixed w-full z-50 transition-all duration-300 bg-white/70 backdrop-blur-xl border-b border-slate-100/80">
                <div className="w-full max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 flex-shrink-0 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-indigo-700 flex-shrink-0" />
                        </div>
                        <span className="text-xl font-display font-bold text-slate-900 tracking-tight">Zilo</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLoginClick}
                            className="text-slate-700 hover:text-indigo-700 transition-colors text-sm font-bold hidden md:block border-0 bg-transparent cursor-pointer"
                        >
                            登录
                        </button>
                        <button
                            onClick={handleLoginClick}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 border-0 cursor-pointer shadow-lg shadow-indigo-200"
                        >
                            免费试用
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow relative">
                <div className="relative z-10">
                    <Hero />
                    <PainPoints />
                    <FeatureHighlight />
                    <InteractiveROI />
                    <Comparison />
                </div>

                {/* Final CTA - Light Mode */}
                <section className="py-32 relative overflow-hidden text-center bg-slate-50 border-t border-slate-200">
                    <div className="absolute inset-0 bg-gradient-radial from-indigo-100/50 to-transparent pointer-events-none" />

                    <div className="container mx-auto px-6 relative z-10">
                        <h2 className="text-4xl md:text-6xl font-display font-black text-slate-900 mb-6 leading-tight tracking-tight">
                            准备好开启 <br />
                            <span className="text-indigo-700">利润增长吗？</span>
                        </h2>
                        <p className="text-slate-700 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
                            加入那些已经告别 "Excel 混乱"，拥抱 "确定性增长" 的领先品牌。
                        </p>
                        <button
                            onClick={handleLoginClick}
                            className="inline-flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white font-bold text-lg rounded-full hover:scale-105 transition-all shadow-xl shadow-indigo-200 border-0 cursor-pointer group hover:bg-indigo-700"
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
