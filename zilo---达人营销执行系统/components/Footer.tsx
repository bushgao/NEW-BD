import React from 'react';
import { Layers } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-100 py-12 text-slate-500 text-sm">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-600 rounded-lg">
             <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">Zilo</span>
        </div>
        
        <div className="flex gap-8 font-medium">
          <a href="#" className="hover:text-brand-600 transition-colors">功能特性</a>
          <a href="#" className="hover:text-brand-600 transition-colors">价格方案</a>
          <a href="http://localhost:5173/login" className="hover:text-brand-600 transition-colors">登录</a>
        </div>

        <div>
          &copy; {new Date().getFullYear()} Zilo Systems. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;