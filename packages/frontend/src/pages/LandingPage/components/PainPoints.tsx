import React from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, MessageCircle, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';

const PainPoints: React.FC = () => {
  const pains = [
    {
      icon: FileSpreadsheet,
      title: "Excel 表格地狱",
      desc: "表格满天飞，版本永远对不上。不仅效率极低，更是数据错误的温床。",
      highlight: "每天浪费 2+ 小时",
      color: "text-blue-400"
    },
    {
      icon: MessageCircle,
      title: "微信消息黑洞",
      desc: "承诺埋在聊天记录里，截图找不到。员工离职，核心数据直接清零。",
      highlight: "客户资产流失",
      color: "text-green-400"
    },
    {
      icon: XCircle,
      title: "样品有去无回",
      desc: "样品寄出几十份，回收寥寥无几。这是一笔巨大的、被忽视的隐形亏损。",
      highlight: "每年亏损数万元",
      color: "text-red-400"
    },
    {
      icon: AlertTriangle,
      title: "虚荣 ROI 陷阱",
      desc: "只看 GMV 不看净利？扣除各项隐形费用，你可能其实一直在赔钱赚吆喝。",
      highlight: "盲目亏损推广",
      color: "text-yellow-400"
    }
  ];

  return (
    <section className="py-32 relative bg-surface-950">

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="mb-20 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="w-12 h-[1px] bg-brand-500"></span>
            <span className="text-brand-300 font-mono text-sm uppercase tracking-widest">核心痛点</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold text-white mb-6"
          >
            别让 <span className="text-gradient-brand">混乱</span> <br />
            蚕食你的利润
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-surface-300 text-lg"
          >
            大多数团队在 "找达人" 上花了大钱，却在 "执行管理" 上把利润一点点漏光。
            传统的管理方式已经跟不上你的增长速度。
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pains.map((pain, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="glass-panel p-8 rounded-3xl group relative overflow-hidden"
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6 inline-flex p-3 rounded-2xl bg-surface-800/50 border border-white/5">
                  <pain.icon className={`w-6 h-6 ${pain.color}`} />
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
                  {pain.title}
                </h3>

                <p className="text-surface-400 text-sm leading-relaxed mb-8 flex-grow">
                  {pain.desc}
                </p>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${pain.color}`}>
                    {pain.highlight}
                  </span>
                  <ChevronRight className="w-4 h-4 text-surface-500 group-hover:translate-x-1 transition-transform" />
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