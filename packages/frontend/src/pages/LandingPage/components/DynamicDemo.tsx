import React, { useEffect, useState } from 'react';
import { MousePointer2, AlertTriangle, User, Send } from 'lucide-react';

const DynamicDemo: React.FC = () => {
    const [step, setStep] = useState(0);

    // Animation Loop
    useEffect(() => {
        const sequence = async () => {
            // 0: Start (Idle)
            await new Promise(r => setTimeout(r, 1000));
            // 1: Cursor Moves to Button
            setStep(1);
            await new Promise(r => setTimeout(r, 1200));
            // 2: Click
            setStep(2);
            await new Promise(r => setTimeout(r, 500));
            // 3: Warning Appears
            setStep(3);
            await new Promise(r => setTimeout(r, 3500));
            // Reset
            setStep(0);
        };

        sequence();
        const interval = setInterval(sequence, 7000);
        return () => clearInterval(interval);
    }, []);

    return (
        // Card Container: White with nice shadow
        <div className="relative w-full max-w-sm mx-auto bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden p-4">
            {/* Header UI */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="text-xs text-slate-400 font-mono">Zilo Intelligent Monitor</div>
            </div>

            {/* Content UI */}
            <div className="space-y-3">
                {/* Creator Card */}
                <div className={`relative p-3 rounded-lg border transition-colors duration-300 ${step === 3 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <User size={20} className="text-slate-500" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-800">Sarah Vogue</div>
                            <div className="text-xs text-slate-500">粉丝数: 12.5W | 带货力: High</div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-3 flex justify-end">
                        <button
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 shadow-sm
                ${step === 2 ? 'scale-95 bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                        >
                            <Send size={12} />
                            发送样品
                        </button>
                    </div>
                </div>

                {/* Fake list items below */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 opacity-50">
                    <div className="h-2 w-1/3 bg-slate-200 rounded mb-2"></div>
                    <div className="h-2 w-1/2 bg-slate-200 rounded"></div>
                </div>
            </div>

            {/* Collision Warning Toast */}
            <div
                className={`absolute top-16 left-4 right-4 bg-white border border-red-200 rounded-lg shadow-xl transform transition-all duration-500 z-20 overflow-hidden
        ${step === 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
            >
                <div className={`flex items-start gap-3 p-3 ${step === 3 ? 'animate-shake' : ''}`}>
                    <div className="p-2 bg-red-50 rounded-full shrink-0">
                        <AlertTriangle size={16} className="text-red-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-red-600">撞单警告</h4>
                        <p className="text-xs text-slate-500 mt-1">
                            同事 <strong>Alex</strong> 正在跟进此达人 (2小时前).
                        </p>
                        <div className="mt-2 text-[10px] text-slate-500 bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200">
                            系统自动拦截
                        </div>
                    </div>
                </div>
            </div>

            {/* Animated Cursor */}
            <div
                className="absolute z-30 transition-all duration-1000 ease-in-out text-slate-900 drop-shadow-lg"
                style={{
                    top: step >= 1 ? '52%' : '80%',
                    left: step >= 1 ? '80%' : '20%',
                    opacity: step === 0 ? 0 : 1,
                    transform: step === 2 ? 'scale(0.9)' : 'scale(1)'
                }}
            >
                <MousePointer2 fill="black" className="text-white" size={24} />
            </div>

        </div>
    );
};

export default DynamicDemo;
