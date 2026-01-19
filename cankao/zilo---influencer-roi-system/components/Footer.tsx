import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 py-12 border-t border-slate-800">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-slate-400 text-sm">
          &copy; 2024 Zilo Inc. All rights reserved.
        </div>
        <div className="flex gap-6 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-white transition-colors">隐私政策</a>
          <a href="#" className="hover:text-white transition-colors">服务条款</a>
          <a href="#" className="hover:text-white transition-colors">联系我们</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;