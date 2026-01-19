import React from 'react';
import { motion } from 'framer-motion';
import { Database, Calculator, Truck, Check, ShieldAlert, UserX } from 'lucide-react';

const FeatureHighlight: React.FC = () => {
    return (
        <section className="py-24 relative overflow-hidden bg-white">
            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Feature 1: The Truth Source */}
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 mb-32">
                    {/* Text Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:w-1/2"
                    >
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 border border-indigo-200 shadow-sm">
                            <Database className="w-6 h-6 text-indigo-700" />
                        </div>

                        <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-slate-900 leading-tight">
                            告别 Excel：<br />
                            <span className="text-indigo-700 decoration-indigo-200 underline decoration-4 underline-offset-4">一个后台管理所有达人</span>
                        </h2>

                        <p className="text-lg text-slate-700 mb-8 leading-relaxed font-medium">
                            停止猜测。Zilo 是你 BD 团队的中央指挥部。
                            自动将聊天记录、导入数据和手工录入整合成一条清晰的时间线。
                        </p>

                        <ul className="space-y-4">
                            {['统一标签体系 (报价、类目、意向度)', '历史合作数据一目了然', '多平台账号唯一身份关联'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-800 font-bold text-base">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-700 border border-indigo-200 shrink-0">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Mockup Side */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="lg:w-1/2 w-full"
                    >
                        <div className="bg-white p-6 rounded-3xl border border-slate-300 shadow-2xl shadow-slate-200/50">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                <div className="font-bold text-slate-900 text-lg">达人数据库</div>
                                <div className="text-xs text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 font-bold">实时同步</div>
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-2.5 w-24 bg-slate-400 rounded-full" />
                                            <div className="h-2 w-16 bg-slate-300 rounded-full" />
                                        </div>
                                        <div className="text-[10px] px-2.5 py-1 bg-green-100 text-green-800 font-bold rounded border border-green-200">已入库</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>


                {/* Feature 2: Conflict Detection */}
                <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-24 mb-32">
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:w-1/2"
                    >
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6 border border-purple-200 shadow-sm">
                            <ShieldAlert className="w-6 h-6 text-purple-700" />
                        </div>

                        <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-slate-900 leading-tight">
                            再也不怕 <span className="text-purple-700 decoration-purple-200 underline decoration-4 underline-offset-4">内部撞单</span>
                        </h2>

                        <p className="text-lg text-slate-700 mb-8 leading-relaxed font-medium">
                            避免两个 BD 同时联系同一个达人的尴尬。
                            系统在创建合作时自动检测，立即发出警报并拦截。
                        </p>

                        <ul className="space-y-4">
                            {['自动识别重复联系', '显示正在跟进的同事与进度', '强制管理员审核机制'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-800 font-bold text-base">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs text-purple-700 border border-purple-200 shrink-0">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="lg:w-1/2 w-full"
                    >
                        {/* Conflict Alert Mockup */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-300 shadow-2xl shadow-slate-200/50 flex flex-col items-center justify-center text-center relative overflow-hidden">
                            {/* Background Stripe */}
                            <div className="absolute top-0 w-full h-2 bg-red-500" />

                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6 border border-red-100">
                                <UserX className="w-8 h-8 text-red-600" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-3">检测到潜在冲突</h3>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 max-w-sm w-full">
                                <p className="text-slate-700 text-sm font-medium leading-relaxed">
                                    <span className="font-bold text-slate-900">@小美老师</span> 正由同事跟进：<br />
                                    <span className="inline-flex items-center gap-1 mt-2 text-purple-700 font-bold bg-purple-100 px-2 py-1 rounded border border-purple-200">
                                        商务-Bob (已寄样)
                                    </span>
                                </p>
                            </div>

                            <div className="w-full flex gap-4">
                                <button className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors border border-slate-200">
                                    取消
                                </button>
                                <button className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold shadow-lg hover:bg-red-700 transition-colors border border-red-700">
                                    申请介入
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>


                {/* Feature 3: Cost & Samples */}
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 mb-32">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:w-1/2"
                    >
                        <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mb-6 border border-pink-200 shadow-sm">
                            <Truck className="w-6 h-6 text-pink-700" />
                        </div>

                        <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-slate-900 leading-tight">
                            单件级追踪，<br />
                            <span className="text-pink-700 decoration-pink-200 underline decoration-4 underline-offset-4">寄出必有回响</span>
                        </h2>

                        <p className="text-lg text-slate-700 mb-8 leading-relaxed font-medium">
                            工厂在无法追踪的样品上损失惨重。Zilo 追踪每一个寄出的单位：
                            谁拿了？发视频了吗？收益能覆盖 COGS 吗？
                        </p>

                        <ul className="space-y-4">
                            {['追踪 样品成本 vs 零售价', '状态流转：寄出 -> 签收 -> 发布', '按活动自动核算总成本'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-800 font-bold text-base">
                                    <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-xs text-pink-700 border border-pink-200 shrink-0">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="lg:w-1/2 w-full"
                    >
                        <div className="bg-white p-8 rounded-3xl border border-slate-300 shadow-2xl shadow-slate-200/50">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-200">
                                    <div className="text-3xl font-black text-slate-900">142</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">寄出样品数</div>
                                </div>
                                <div className="bg-pink-50 p-4 rounded-2xl text-center border border-pink-200">
                                    <div className="text-3xl font-black text-pink-700">¥12k</div>
                                    <div className="text-[10px] text-pink-700 font-bold uppercase tracking-wider mt-1">总 COGS 成本</div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                                    <span className="text-sm font-bold text-slate-800">光感面膜 X2</span>
                                    <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded border border-yellow-200 font-bold">运输中</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                                    <span className="text-sm font-bold text-slate-800">紧致精华套装</span>
                                    <span className="text-[10px] bg-green-100 text-green-800 px-2.5 py-1 rounded border border-green-200 font-bold">视频已上线</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Feature 4: Real ROI */}
                <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-24">
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:w-1/2"
                    >
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 border border-emerald-200 shadow-sm">
                            <Calculator className="w-6 h-6 text-emerald-700" />
                        </div>

                        <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-slate-900 leading-tight">
                            算清每个达人的 <br /> <span className="text-emerald-700 decoration-emerald-200 underline decoration-4 underline-offset-4">真实回报率</span>
                        </h2>

                        <p className="text-lg text-slate-700 mb-8 leading-relaxed font-medium">
                            别被虚荣指标欺骗。我们通过计入能耗、运费、佣金和坑位费，帮你算出<strong>真实</strong>的净利润。
                        </p>

                        <ul className="space-y-4">
                            {['单达人利润表 (P&L)', '团队人效与佣金对账', '盈亏平衡点自动计算'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-800 font-bold text-base">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs text-emerald-700 border border-emerald-200 shrink-0">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="lg:w-1/2 w-full"
                    >
                        <div className="bg-white p-8 rounded-3xl border border-slate-300 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                            <div className="absolute top-4 right-4 text-xs text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg bg-emerald-100 font-bold">
                                实时利润分析
                            </div>

                            <div className="space-y-6 pt-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-500 font-bold">销售额 (GMV)</span>
                                        <span className="text-slate-900 font-black text-lg">¥50,000</span>
                                    </div>
                                    <div className="h-2.5 bg-emerald-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-600 w-full animate-pulse"></div>
                                    </div>
                                </div>

                                <div className="pl-4 border-l-4 border-slate-100 space-y-4">
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-slate-600 font-bold">佣金支出 (20%)</span>
                                        <span className="text-red-600 font-mono font-bold">-¥10,000</span>
                                    </div>
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-slate-600 font-bold">样品成本 (COGS)</span>
                                        <span className="text-red-600 font-mono font-bold">-¥500</span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                                    <span className="text-slate-900 font-black text-lg">真实净利</span>
                                    <div className="text-right">
                                        <span className="block text-4xl font-black text-emerald-700 tracking-tight">¥39,300</span>
                                        <span className="text-xs font-bold text-emerald-600 mt-1 block">ROI: 3.8x</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

            </div>
        </section>
    );
};

export default FeatureHighlight;
