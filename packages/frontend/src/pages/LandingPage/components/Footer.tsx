import React from 'react';
import { Layers } from 'lucide-react';

const Footer: React.FC = () => {
  // Removed useNavigate since we removed the Login button from footer

  return (
    <footer className="bg-slate-900 border-t border-white/5 py-12 text-slate-400 text-sm">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-500 to-violet-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Zilo</span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="flex gap-6">
              <button className="hover:text-white transition-colors cursor-pointer">隐私政策</button>
              <button className="hover:text-white transition-colors cursor-pointer">服务条款</button>
              <button className="hover:text-white transition-colors cursor-pointer">联系我们</button>
            </div>
          </div>

          <div className="text-slate-500 flex items-center gap-4">
            <span>© {new Date().getFullYear()} Zilo Inc.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
