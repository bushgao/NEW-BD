import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoleSelectModalProps {
    open: boolean;
    onClose: () => void;
}

const RoleSelectModal: React.FC<RoleSelectModalProps> = ({ open, onClose }) => {
    const navigate = useNavigate();

    const handleSelect = (role: 'brand' | 'influencer') => {
        // In a real app check for auth flow, for now just navigate
        if (role === 'brand') {
            navigate('/login');
        } else {
            navigate('/login?role=influencer'); // Or specific influencer entry
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
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        {/* Modal Container */}
                        <div onClick={(e) => e.stopPropagation()}>
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="w-full max-w-lg bg-white rounded-3xl p-8 relative shadow-2xl overflow-hidden"
                            >
                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors border-0 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Header */}
                                <div className="text-center mb-10">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">选择您的身份</h3>
                                    <p className="text-slate-500">请选择您要登录或注册的账户类型</p>
                                </div>

                                {/* Options */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Brand Option */}
                                    <button
                                        onClick={() => handleSelect('brand')}
                                        className="group relative p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all text-left flex flex-col items-center gap-4 cursor-pointer"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-indigo-100">
                                            <Building2 className="w-8 h-8 text-indigo-600" />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-slate-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">我是品牌方</div>
                                            <div className="text-xs text-slate-500">寻找达人，管理寄样与ROI</div>
                                        </div>
                                    </button>

                                    {/* Influencer Option */}
                                    <button
                                        onClick={() => handleSelect('influencer')}
                                        className="group relative p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/10 transition-all text-left flex flex-col items-center gap-4 cursor-pointer"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-purple-100">
                                            <User className="w-8 h-8 text-purple-600" />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-slate-900 text-lg mb-1 group-hover:text-purple-600 transition-colors">我是达人</div>
                                            <div className="text-xs text-slate-500">寻找合作，管理样品与排期</div>
                                        </div>
                                    </button>
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
