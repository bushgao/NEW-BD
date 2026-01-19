import React from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, MessageCircle, AlertTriangle, XCircle, Users, ChevronRight } from 'lucide-react';

const PainPoints: React.FC = () => {
    const pains = [
        {
            icon: FileSpreadsheet,
            title: "效率下降 70%",
            desc: "表格满天飞，版本永远对不上。每天花费大量时间在填表和核对上，而非业务本身。",
            highlight: "每天浪费 2+ 小时",
            color: "text-blue-700",
            bg: "bg-blue-50",
            border: "border-blue-200"
        },
        {
            icon: MessageCircle,
            title: "信息散落微信",
            desc: "承诺埋在聊天记录里，截图找不到。核心数据随员工离职直接清零。",
            highlight: "客户资产流失",
            color: "text-green-700",
            bg: "bg-green-50",
            border: "border-green-200"
        },
        {
            icon: XCircle,
            title: "样品有去无回",
            desc: "样品寄出几十份，回收寥寥无几。这是一笔巨大的、被忽视的隐形亏损。",
            highlight: "隐形亏损 ¥5万+",
            color: "text-red-700",
            bg: "bg-red-50",
            border: "border-red-200"
        },
        {
            icon: Users,
            title: "撞单内耗",
            desc: "两个BD同时联系一个达人，客户反感，内部扯皮。团队越大，错误越多。",
            highlight: "团队协作损耗",
            color: "text-purple-700",
            bg: "bg-purple-50",
            border: "border-purple-200"
        },
        {
            icon: AlertTriangle,
            title: "虚荣 ROI 陷阱",
            desc: "只看 GMV 不看净利？扣除各项隐形费用，其实一直在赔钱赚吆喝。",
            highlight: "80%品牌算错账",
            color: "text-yellow-700",
            bg: "bg-yellow-50",
            border: "border-yellow-200"
        }
    ];

    return (
        <section className="py-20 relative bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="mb-12 max-w-2xl">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-8 h-[3px] bg-indigo-600 rounded-full"></span>
                        <span className="text-indigo-700 font-bold text-sm uppercase tracking-widest">核心痛点</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
                        别让 <span className="text-red-600">混乱</span> 蚕食你的利润
                    </h2>

                    <p className="text-slate-700 text-lg leading-relaxed font-medium">
                        大多数团队在 "找达人" 上花了大钱，却在 "执行管理" 上把利润一点点漏光。
                    </p>
                </div>

                {/* Compact Grid Layout - 3+2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {pains.map((pain, idx) => (
                        <div
                            key={idx}
                            className={`bg-white p-6 rounded-2xl flex flex-col border border-slate-300 shadow-sm hover:shadow-lg transition-all duration-300 ${idx >= 3 ? 'lg:col-span-1.5' : ''
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`inline-flex p-2.5 rounded-xl ${pain.bg} border ${pain.border}`}>
                                    <pain.icon className={`w-5 h-5 ${pain.color}`} />
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300" />
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                {pain.title}
                            </h3>

                            <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                                {pain.desc}
                            </p>

                            <div className="pt-4 border-t border-slate-100 mt-auto">
                                <span className={`text-xs font-bold uppercase tracking-wider ${pain.color}`}>
                                    {pain.highlight}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PainPoints;
