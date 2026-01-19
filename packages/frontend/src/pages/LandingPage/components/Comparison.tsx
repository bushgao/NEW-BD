import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Shield, Zap, TrendingUp, Users, Database, ShieldAlert } from 'lucide-react';

const Comparison: React.FC = () => {
    const features = [
        {
            name: "核心痛点解决",
            zilo: "全流程闭环管家 (寄样-回收-利润)",
            others: "仅提供表格记录, 执行全靠人肉",
            icon: Shield
        },
        {
            name: "防撞单机制",
            zilo: "系统自动拦截，显示冲突方",
            others: "靠群里吼，撞单了才知道",
            icon: ShieldAlert
        },
        {
            name: "样品管理",
            zilo: "单件级追踪 & 自动催还系统",
            others: "寄出就忘，丢失无法追溯",
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
            others: "微信传文件, 版本永远对不上",
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
        <section className="py-32 relative overflow-hidden bg-white">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6"
                    >
                        为什么选择 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Zilo</span> ?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-600 text-lg"
                    >
                        不要为了 "找达人" 买工具，要为了 "赚到钱" 买系统。
                    </motion.p>
                </div>

                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50">
                        {/* Header */}
                        <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-100 bg-slate-50/50">
                            <div className="md:col-span-4 p-6 hidden md:flex items-center text-slate-500 font-bold uppercase tracking-wider text-sm">
                                对比维度
                            </div>
                            <div className="md:col-span-4 p-6 bg-indigo-50/50 border-x border-indigo-100 flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-400" />
                                <div className="text-2xl font-black text-slate-900 flex items-center gap-2 mb-1">
                                    Zilo
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                </div>
                                <div className="text-indigo-600 text-xs font-bold uppercase tracking-wider">智能执行系统</div>
                            </div>
                            <div className="md:col-span-4 p-6 flex flex-col items-center justify-center text-slate-500">
                                <div className="text-xl font-bold mb-1 text-slate-700">Excel + 微信</div>
                                <div className="text-xs font-bold uppercase tracking-wider">传统人工方式</div>
                            </div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-slate-100">
                            {features.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="grid grid-cols-1 md:grid-cols-12 group hover:bg-slate-50 transition-colors"
                                >
                                    {/* Feature Name */}
                                    <div className="md:col-span-4 p-6 flex items-center gap-3 text-slate-700 font-bold">
                                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 shrink-0 shadow-sm">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        {item.name}
                                    </div>

                                    {/* Zilo Side */}
                                    <div className="md:col-span-4 p-6 bg-indigo-50/30 border-x border-indigo-100/50 flex items-center justify-center md:justify-start gap-4 relative">
                                        <div className="absolute inset-0 bg-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 border border-green-200">
                                            <Check className="w-3 h-3 text-green-600" />
                                        </div>
                                        <span className="text-slate-900 font-bold text-sm md:text-base text-center md:text-left leading-tight">{item.zilo}</span>
                                    </div>

                                    {/* Others Side */}
                                    <div className="md:col-span-4 p-6 flex items-center justify-center md:justify-start gap-4 text-slate-400 opacity-80 group-hover:opacity-100 transition-opacity decoration-slice">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                            <X className="w-3 h-3 text-slate-500" />
                                        </div>
                                        <span className="text-sm md:text-base line-through decoration-slate-300 text-center md:text-left leading-tight">{item.others}</span>
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
