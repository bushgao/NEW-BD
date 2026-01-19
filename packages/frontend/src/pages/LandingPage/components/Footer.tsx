import React from 'react';
import { Layers, Heart } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-950 text-white py-6 relative overflow-hidden">

            <div className="w-full max-w-7xl mx-auto px-6 relative z-10">

                {/* Single Row: Logo + Description */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700">
                        <Layers className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-lg font-display font-bold text-white tracking-tight">Zilo</span>
                    <span className="text-slate-600 hidden md:inline">|</span>
                    <p className="text-slate-400 text-sm hidden md:block">
                        专为现代 BD 团队打造的达人管理系统。从建联到复盘，全流程数据化、透明化。
                    </p>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-slate-500 text-xs">
                    <div>© 2026 Zilo Inc. All rights reserved.</div>
                    <div className="flex items-center gap-1">
                        Made with <Heart className="w-3 h-3 text-red-500 fill-current" /> by Zilo Team
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
