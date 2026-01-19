import React from 'react';
import { FileSpreadsheet, PackageX, Users, TrendingDown, ShieldAlert, ChevronRight } from 'lucide-react';

const PainPoints: React.FC = () => {
  const points = [
    {
      icon: <FileSpreadsheet className="text-orange-500" size={24} />,
      title: "表格地狱，效率下降 70%",
      desc: "每天花费数小时手动维护 Excel，信息同步慢，版本混乱，根本没时间开发新达人。"
    },
    {
      icon: <PackageX className="text-red-500" size={24} />,
      title: "样品有去无回，隐形亏损 ¥5万+",
      desc: "寄出样品就像石沉大海，谁收了？谁发帖了？完全无法追踪，每年浪费巨额成本。"
    },
    {
      icon: <ShieldAlert className="text-amber-500" size={24} />,
      title: "撞单内耗，团队尴尬",
      desc: "多个商务联系同一个达人，不仅显得品牌不专业，还导致内部抢单、重复承诺。"
    },
    {
      icon: <TrendingDown className="text-pink-500" size={24} />,
      title: "ROI 黑盒，盲目投放",
      desc: "不知道哪个达人真正带货，只能凭感觉复投，导致营销预算大量浪费在无效流量上。"
    },
    {
      icon: <Users className="text-blue-500" size={24} />,
      title: "达人资产无法沉淀",
      desc: "商务离职带走资源，所有沟通记录和合作关系不仅没有留存，还得从零开始。"
    }
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">为什么你的种草营销越做越累？</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            传统的表格+微信管理模式，已经跟不上现在的流量节奏。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {points.map((item, index) => (
            <div 
              key={index} 
              className="group p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-slate-100">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
          
          {/* Last card is a CTA card */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center hover:bg-slate-100 transition-colors">
            <h3 className="text-lg font-semibold text-slate-700 mb-2">受够了这些问题？</h3>
            <button className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors flex items-center gap-1">
              看看 Zilo 的解法 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PainPoints;