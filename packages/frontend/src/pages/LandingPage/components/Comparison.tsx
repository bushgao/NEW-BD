import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Shield, Zap, TrendingUp, Users, Database } from 'lucide-react';

const Comparison: React.FC = () => {
  const features = [
    {
      name: "核心痛点解决",
      zilo: "全流程闭环管家 (寄样-回收-利润)",
      others: "仅提供达人查找, 执行全靠人肉",
      icon: Shield
    },
    {
      name: "样品管理",
      zilo: "单件级追踪 & 自动催还系统",
      others: "靠 Excel 手动记录, 丢失无法追溯",
      icon: Zap
    },
    {
      name: "ROI 计算",
      zilo: "净利润视角 (含隐形成本/人效)",
      others: "仅 GMV (虚荣指标, 忽视亏损)",
      icon: TrendingUp
    },
    {
      name: "团队协作",
      zilo: "多人实时同步, 权限分级",
      others: "文件传输, 版本混乱, 撞单频繁",
      icon: Users
    },
    {
      name: "数据沉淀",
      zilo: "私有达人库, 企业的永久资产",
      others: "销售离职 = 数据带走 = 从零开始",
      icon: Database
    },
  ];

  return (
    <section className="py-32 relative overflow-hidden bg-surface-950">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold text-white mb-6"
          >
            为什么选择 <span className="text-gradient from-brand-400 to-accent-400">Zilo</span> ?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-surface-300 text-lg"
          >
            不要为了 "找达人" 买工具，要为了 "赚到钱" 买系统。
          </motion.p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="glass-panel rounded-3xl overflow-hidden ring-1 ring-white/10">
            {/* Header */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-white/5 bg-surface-900/50">
              <div className="md:col-span-4 p-6 hidden md:flex items-center text-surface-400 font-bold uppercase tracking-wider text-sm">
                对比维度
              </div>
              <div className="md:col-span-4 p-6 bg-brand-900/20 border-x border-brand-500/10 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-brand-400 to-accent-400" />
                <div className="text-2xl font-black text-white flex items-center gap-2 mb-1">
                  Zilo
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                </div>
                <div className="text-brand-300 text-xs font-bold uppercase tracking-wider">智能执行系统</div>
              </div>
              <div className="md:col-span-4 p-6 flex flex-col items-center justify-center text-surface-500">
                <div className="text-xl font-bold mb-1">传统/其他工具</div>
                <div className="text-xs font-bold uppercase tracking-wider">仅提供达人查找</div>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/5">
              {features.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="grid grid-cols-1 md:grid-cols-12 group hover:bg-white/5 transition-colors"
                >
                  {/* Feature Name */}
                  <div className="md:col-span-4 p-6 flex items-center gap-3 text-white font-bold">
                    <div className="p-2 rounded-lg bg-surface-800 text-surface-400 shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    {item.name}
                  </div>

                  {/* Zilo Side */}
                  <div className="md:col-span-4 p-6 bg-brand-900/5 border-x border-brand-500/5 flex items-center justify-center md:justify-start gap-3 relative">
                    <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 border border-green-500/30">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-white font-medium text-sm md:text-base text-center md:text-left">{item.zilo}</span>
                  </div>

                  {/* Others Side */}
                  <div className="md:col-span-4 p-6 flex items-center justify-center md:justify-start gap-3 text-surface-500 opacity-60 group-hover:opacity-80 transition-opacity decoration-slice">
                    <div className="w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center shrink-0">
                      <X className="w-3 h-3" />
                    </div>
                    <span className="text-sm md:text-base line-through decoration-surface-600 text-center md:text-left">{item.others}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Comparison;