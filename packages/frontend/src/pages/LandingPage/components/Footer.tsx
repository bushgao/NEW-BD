import React from 'react';
import { Layers, Github, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-950 border-t border-white/5 py-20 text-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 glass-panel rounded-lg flex items-center justify-center text-white font-bold text-lg">
                <Layers className="w-5 h-5 text-brand-400" />
              </div>
              <span className="font-display font-bold text-white text-xl tracking-tight">Zilo</span>
            </div>
            <p className="text-surface-400 leading-relaxed max-w-sm mb-8">
              Zilo 是专为从"粗放投放"转向"精细化运营"的品牌设计的达人营销执行系统。让每一份样品的流转、每一笔佣金的支出都清晰可见。
            </p>
            <div className="flex gap-4">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <button key={i} className="w-10 h-10 rounded-full bg-surface-800/50 flex items-center justify-center text-surface-400 hover:bg-brand-500 hover:text-white transition-all">
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">产品</h4>
            <ul className="space-y-4 text-surface-400">
              {['功能特性', 'ROI 计算器', '价格方案', '更新日志'].map(item => (
                <li key={item}><button className="hover:text-brand-300 transition-colors cursor-pointer text-left">{item}</button></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">公司</h4>
            <ul className="space-y-4 text-surface-400">
              {['关于我们', '招贤纳士', '联系方式', '隐私政策'].map(item => (
                <li key={item}><button className="hover:text-brand-300 transition-colors cursor-pointer text-left">{item}</button></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-surface-500">
          <span>© {new Date().getFullYear()} Zilo Inc. 保留所有权利。</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            系统运行正常
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
