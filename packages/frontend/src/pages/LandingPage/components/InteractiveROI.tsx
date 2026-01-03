import React, { useState } from 'react';
import { motion } from 'framer-motion';

const InteractiveROI: React.FC = () => {
  const [gmv, setGmv] = useState(10000);
  const [commission, setCommission] = useState(20); // percent
  const [sampleCost, setSampleCost] = useState(500); // fixed
  const [shipping, setShipping] = useState(150); // fixed

  const commValue = gmv * (commission / 100);
  const totalCost = commValue + sampleCost + shipping;
  const profit = gmv - totalCost;
  const roi = totalCost > 0 ? (gmv / totalCost).toFixed(2) : '0';

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative bg elements */}
      <div className="absolute left-0 top-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-white to-white -z-10"></div>

      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-16 shadow-2xl shadow-slate-200/50">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black mb-6 text-slate-900">
                看清你的 <span className="text-brand-600">真实净利</span>
              </h2>
              <p className="text-slate-600 mb-10 text-lg leading-relaxed">
                调整滑块，看看 Zilo 如何通过计入隐形成本，自动计算每次合作的真实价值。
              </p>
              
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-bold text-slate-700">销售额 (GMV)</label>
                    <span className="text-brand-600 font-mono font-bold bg-brand-50 px-2 py-1 rounded">¥{gmv.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" min="1000" max="50000" step="500" 
                    value={gmv} onChange={(e) => setGmv(Number(e.target.value))}
                    className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-500 hover:accent-brand-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-bold text-slate-700">佣金比例 (Commission)</label>
                    <span className="text-purple-600 font-mono font-bold bg-purple-50 px-2 py-1 rounded">{commission}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="50" step="1" 
                    value={commission} onChange={(e) => setCommission(Number(e.target.value))}
                    className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                  />
                </div>

                <div>
                   <div className="flex justify-between mb-3">
                    <label className="text-sm font-bold text-slate-700">样品成本 (COGS)</label>
                    <span className="text-pink-600 font-mono font-bold bg-pink-50 px-2 py-1 rounded">¥{sampleCost}</span>
                  </div>
                  <input 
                    type="range" min="0" max="2000" step="50" 
                    value={sampleCost} onChange={(e) => setSampleCost(Number(e.target.value))}
                    className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-3xl p-10 flex flex-col justify-center relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                     <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
               </div>

               <div className="space-y-5 relative z-10">
                  <div className="flex justify-between items-center text-sm font-medium text-slate-400">
                    <span>总收入 (Revenue)</span>
                    <span className="text-white font-bold text-base">+ ¥{gmv.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-slate-800" />
                  <div className="flex justify-between items-center text-sm font-medium text-slate-400">
                    <span>佣金支出</span>
                    <span className="text-red-400">- ¥{commValue.toLocaleString()}</span>
                  </div>
                   <div className="flex justify-between items-center text-sm font-medium text-slate-400">
                    <span>产品成本</span>
                    <span className="text-red-400">- ¥{sampleCost.toLocaleString()}</span>
                  </div>
                   <div className="flex justify-between items-center text-sm font-medium text-slate-400">
                    <span>物流履约</span>
                    <span className="text-red-400">- ¥{shipping.toLocaleString()}</span>
                  </div>
                  
                  <div className="h-px bg-slate-700 my-6" />

                  <div className="flex justify-between items-end">
                    <span className="text-xl font-bold text-white">净利润 (Profit)</span>
                    <motion.span 
                      key={profit}
                      initial={{ scale: 1.2, color: '#fff' }}
                      animate={{ scale: 1, color: profit > 0 ? '#4ade80' : '#f87171' }}
                      className="text-5xl font-black tracking-tight"
                    >
                      ¥{profit.toLocaleString()}
                    </motion.span>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-sm font-bold px-3 py-1.5 rounded-full ${Number(roi) > 1 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      ROI: {roi}x
                    </span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveROI;