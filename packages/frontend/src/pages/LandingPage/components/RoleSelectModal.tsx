import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, User, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoleSelectModalProps {
    open: boolean;
    onClose: () => void;
}

const RoleSelectModal: React.FC<RoleSelectModalProps> = ({ open, onClose }) => {
    const navigate = useNavigate();

    const handleSelect = (role: 'brand' | 'influencer') => {
        if (role === 'brand') {
            navigate('/login');
        } else {
            navigate('/influencer-portal/login');
        }
        onClose();
    };

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
                                className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
                            >
                                {/* Branded Header */}
                                <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 px-8 py-6 text-white relative overflow-hidden">
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
                                    <div className="relative z-10 flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 flex-shrink-0 bg-white/15 rounded-xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
                                            <Layers className="w-5 h-5 text-white flex-shrink-0" />
                                        </div>
                                        <span className="text-xl font-bold">Zilo</span>
                                    </div>
                                    <h3 className="relative z-10 text-xl font-bold mb-1">选择您的身份</h3>
                                    <p className="relative z-10 text-indigo-100 text-sm">请选择您要登录或注册的账户类型</p>
                                </div>

                                {/* Options */}
                                <div className="p-6 bg-slate-50">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Brand Option */}
                                        <button
                                            onClick={() => handleSelect('brand')}
                                            className="group relative p-5 rounded-2xl bg-white hover:bg-gradient-to-br hover:from-indigo-50 hover:to-white transition-all text-center flex flex-col items-center gap-3 cursor-pointer shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-200/50 border-0"
                                        >
                                            <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-indigo-200">
                                                <Building2 className="w-7 h-7 text-white flex-shrink-0" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-base mb-1 group-hover:text-indigo-700 transition-colors">我是品牌方</div>
                                                <div className="text-xs text-slate-400 leading-relaxed">寻找达人<br />管理寄样与ROI</div>
                                            </div>
                                        </button>

                                        {/* Influencer Option */}
                                        <button
                                            onClick={() => handleSelect('influencer')}
                                            className="group relative p-5 rounded-2xl bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-white transition-all text-center flex flex-col items-center gap-3 cursor-pointer shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-purple-200/50 border-0"
                                        >
                                            <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-200">
                                                <User className="w-7 h-7 text-white flex-shrink-0" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-base mb-1 group-hover:text-purple-700 transition-colors">我是达人</div>
                                                <div className="text-xs text-slate-400 leading-relaxed">寻找合作<br />管理样品与排期</div>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Footer Tip */}
                                    <p className="text-center text-xs text-slate-400 mt-5">
                                        首次使用？选择身份后即可注册账号
                                    </p>
                                </div>

                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default RoleSelectModal;
