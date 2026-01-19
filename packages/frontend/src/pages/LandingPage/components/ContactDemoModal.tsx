import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Layers } from 'lucide-react';

interface ContactDemoModalProps {
    open: boolean;
    onClose: () => void;
}

const ContactDemoModal: React.FC<ContactDemoModalProps> = ({ open, onClose }) => {
    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        {/* Modal Container */}
                        <div onClick={(e) => e.stopPropagation()}>
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
                            >
                                {/* Branded Header */}
                                <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 px-6 py-5 text-white relative overflow-hidden">
                                    {/* Background Pattern */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/10 rounded-full blur-xl" />

                                    {/* Close Button */}
                                    <button
                                        onClick={onClose}
                                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors border-0 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" strokeWidth={2.5} />
                                    </button>

                                    {/* Logo & Title */}
                                    <div className="relative z-10 flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 flex-shrink-0 bg-white/15 rounded-xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
                                            <Layers className="w-5 h-5 text-white flex-shrink-0" />
                                        </div>
                                        <span className="text-xl font-bold">Zilo</span>
                                    </div>
                                    <h3 className="relative z-10 text-lg font-bold">预约产品演示</h3>
                                </div>

                                {/* Content */}
                                <div className="p-6 bg-slate-50">
                                    {/* QR Code */}
                                    <div className="bg-white rounded-2xl p-4 shadow-lg shadow-slate-200/50 mb-4">
                                        <img
                                            src="/wechat-demo-qr.jpg"
                                            alt="WeChat QR Code"
                                            className="w-full max-w-[200px] mx-auto rounded-xl"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="text-center space-y-2">
                                        <div className="flex items-center justify-center gap-2 text-slate-700 font-bold">
                                            <MessageCircle className="w-5 h-5 text-green-500" />
                                            <span>扫码添加微信</span>
                                        </div>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            我们的产品顾问将为您提供<br />
                                            <span className="text-indigo-600 font-medium">1对1 专属产品演示</span>
                                        </p>
                                    </div>

                                    {/* Features */}
                                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-white rounded-xl px-3 py-2 text-center text-slate-600 shadow-sm">
                                            ✨ 功能详细讲解
                                        </div>
                                        <div className="bg-white rounded-xl px-3 py-2 text-center text-slate-600 shadow-sm">
                                            🎯 定制化方案
                                        </div>
                                        <div className="bg-white rounded-xl px-3 py-2 text-center text-slate-600 shadow-sm">
                                            💡 最佳实践分享
                                        </div>
                                        <div className="bg-white rounded-xl px-3 py-2 text-center text-slate-600 shadow-sm">
                                            🚀 快速上手指导
                                        </div>
                                    </div>
                                </div>

                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ContactDemoModal;
