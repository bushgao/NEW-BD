import React from 'react';
import { Check, X } from 'lucide-react';

const Comparison: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">为什么选择 Zilo？</h2>
          <p className="text-slate-500">告别原始的手工作业，拥抱数字化管理</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="p-6 text-slate-500 font-medium w-1/3">功能对比</th>
                <th className="p-6 text-slate-500 font-semibold bg-slate-50 w-1/3 text-center">Excel + 微信</th>
                <th className="p-6 text-indigo-600 font-bold bg-indigo-50 w-1/3 text-center">Zilo 系统</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-6 text-slate-700">防撞单机制</td>
                <td className="p-6 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-1">
                        <X size={20} className="text-red-400" />
                        <span className="text-xs">靠吼，靠群聊</span>
                    </div>
                </td>
                <td className="p-6 text-center bg-indigo-50/50">
                    <div className="flex flex-col items-center gap-1">
                        <Check size={20} className="text-indigo-600" />
                        <span className="text-xs text-indigo-700">系统自动拦截</span>
                    </div>
                </td>
              </tr>
              <tr>
                <td className="p-6 text-slate-700">样品物流追踪</td>
                <td className="p-6 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-1">
                        <X size={20} className="text-red-400" />
                        <span className="text-xs">手动查单号</span>
                    </div>
                </td>
                <td className="p-6 text-center bg-indigo-50/50">
                    <div className="flex flex-col items-center gap-1">
                        <Check size={20} className="text-indigo-600" />
                        <span className="text-xs text-indigo-700">自动同步状态</span>
                    </div>
                </td>
              </tr>
              <tr>
                <td className="p-6 text-slate-700">达人资产沉淀</td>
                <td className="p-6 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-1">
                        <X size={20} className="text-red-400" />
                        <span className="text-xs">员工离职即流失</span>
                    </div>
                </td>
                <td className="p-6 text-center bg-indigo-50/50">
                    <div className="flex flex-col items-center gap-1">
                        <Check size={20} className="text-indigo-600" />
                        <span className="text-xs text-indigo-700">永久云端保存</span>
                    </div>
                </td>
              </tr>
              <tr>
                <td className="p-6 text-slate-700">ROI 报表</td>
                <td className="p-6 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-1">
                        <X size={20} className="text-red-400" />
                        <span className="text-xs">手动统计，容易出错</span>
                    </div>
                </td>
                <td className="p-6 text-center bg-indigo-50/50">
                    <div className="flex flex-col items-center gap-1">
                        <Check size={20} className="text-indigo-600" />
                        <span className="text-xs text-indigo-700">实时可视化看板</span>
                    </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Comparison;