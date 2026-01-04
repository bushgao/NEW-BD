import React from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, MessageCircle, AlertTriangle, XCircle } from 'lucide-react';

const PainPoints: React.FC = () => {
  const pains = [
    {
      icon: FileSpreadsheet,
      title: "Excel 表格地狱",
      desc: "表格满天飞，版本永远对不上。不仅效率极低，更是数据错误的温床。",
      highlight: "每天浪费 2+ 小时"
    },
    {
      icon: MessageCircle,
      title: "微信消息黑洞",
      desc: "承诺埋在聊天记录里，截图找不到。员工离职，核心数据直接清零。",
      highlight: "客户资产流失"
    },
    {
      icon: XCircle,
      title: "样品有去无回",
      desc: "样品寄出几十份，回收寥寥无几。这是一笔巨大的、被忽视的隐形亏损。",
      highlight: "每年亏损数万元"
    },
    {
      icon: AlertTriangle,
      title: "虚荣 ROI 陷阱",
      desc: "只看 GMV 不看净利？扣除各项隐形费用，你可能其实一直在赔钱赚吆喝。",
      highlight: "盲目亏损推广"
    }
  ];

  return (
    <section className="py-32 relative overflow-hidden bg-slate-50">
        {/* Dynamic Background Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3], 
                    x: [0, 50, 0],
                    y: [0, 30, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-100/40 rounded-full blur-[100px]" 
            />
            <motion.div 
                animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                    x: [0, -30, 0],
                    y: [0, -50, 0]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-orange-100/40 rounded-full blur-[120px]" 
            />
        </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-block mb-6 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 font-bold text-sm"
            >
                ⚠️ 警惕低效陷阱
            </motion.div>
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-900 tracking-tight">
            别让 <span className="text-red-500 relative inline-block px-2">
                混乱
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-red-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
            </span> 吞噬你的利润
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-xl leading-relaxed">
            大多数团队在"找达人"上花了大钱，却在"执行管理"上<br className="hidden md:block" />把利润一点点漏光。
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pains.map((pain, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:border-red-100 transition-colors"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
                    <pain.icon className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-black mb-3 text-slate-900">{pain.title}</h3>
                <p className="text-slate-500 leading-relaxed mb-6 h-20 text-sm md:text-base">{pain.desc}</p>
                <div className="flex items-center gap-2 text-red-600 font-bold text-sm bg-red-50/50 p-3 rounded-xl border border-red-100/50">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {pain.highlight}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PainPoints;