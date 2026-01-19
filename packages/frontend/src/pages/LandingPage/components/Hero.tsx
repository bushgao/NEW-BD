import React, { useState } from 'react';
import { ArrowRight, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeroBackground from './HeroBackground';
import DynamicDemo from './DynamicDemo';
import ContactDemoModal from './ContactDemoModal';

const Hero: React.FC = () => {
    const navigate = useNavigate();
    const [showContactModal, setShowContactModal] = useState(false);

    return (
        <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden bg-white">

            {/* Background - kept as is but lower z-index to be safe */}
            <div className="absolute inset-0 z-0">
                <HeroBackground />
            </div>

            <div className="w-full max-w-7xl mx-auto px-6 relative z-10 pt-20 pb-16 lg:pt-0">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 w-full">

                    {/* Left Column: Copy - Enforced Solids */}
                    <div className="flex-1 text-center lg:text-left">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 mb-6 cursor-default">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                            </span>
                            <span className="text-xs font-bold tracking-widest text-indigo-700 uppercase">
                                撞单检测 V2.0
                            </span>
                        </div>

                        {/* Main Headline - No Gradients, Pure Text */}
                        <h1 className="text-4xl lg:text-5xl font-display font-black tracking-tight text-slate-900 mb-6 leading-[1.2]">
                            寄了50份样品，<br />
                            有几个<span className="text-indigo-700">真正带货了？</span>
                        </h1>

                        {/* Subheadline - solid slate-700 */}
                        <p className="text-base md:text-lg text-slate-700 max-w-2xl mx-auto lg:mx-0 mb-8 font-medium leading-relaxed">
                            不缺达人，缺的是算清账的系统。<br className="hidden md:block" />
                            Zilo 让每一笔投入都<strong className="text-slate-900 font-bold border-b-2 border-indigo-200 mx-1">透明可控</strong>，告别"赔钱赚吆喝"。
                        </p>

                        {/* CTA Buttons - Compact */}
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                            <button
                                onClick={() => navigate('/register')}
                                className="group relative h-11 px-6 bg-indigo-600 text-white font-bold text-base rounded-full overflow-hidden hover:bg-indigo-700 hover:scale-105 transition-all duration-300 shadow-lg shadow-indigo-200 border-0 cursor-pointer flex items-center justify-center gap-2"
                            >
                                免费体验30天
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => setShowContactModal(true)}
                                className="group h-11 px-5 bg-white rounded-full text-slate-700 font-bold text-base hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-slate-200/60 border-0"
                            >
                                <div className="w-7 h-7 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <Phone className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-600" />
                                </div>
                                <span className="group-hover:text-indigo-900 transition-colors">联系演示</span>
                            </button>
                        </div>

                        {/* Social Proof */}
                        <div className="mt-6 flex items-center justify-center lg:justify-start gap-3 text-sm text-slate-600 font-semibold">
                            <div className="flex -space-x-2">
                                {['/avatars/avatar1.png', '/avatars/avatar2.png', '/avatars/avatar3.png', '/avatars/avatar4.png'].map((src, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden relative shadow-sm">
                                        <img src={src} alt={`用户 ${i + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <p>
                                <span className="text-slate-900 font-bold">15,000+</span> 商务人员正在使用
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Dynamic Demo */}
                    <div className="flex-1 w-full max-w-[500px] lg:max-w-none">
                        <DynamicDemo />
                    </div>

                </div>
            </div>

            {/* Contact Demo Modal */}
            <ContactDemoModal
                open={showContactModal}
                onClose={() => setShowContactModal(false)}
            />
        </section>
    );
};

export default Hero;

