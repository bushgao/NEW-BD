import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import { Users, Briefcase, ArrowRight } from 'lucide-react';

interface RoleSelectModalProps {
    open: boolean;
    onClose: () => void;
}

/**
 * 角色选择弹窗
 * 用户点击登录/免费试用后，选择"我是达人"或"我是品牌/商务"
 */
const RoleSelectModal = ({ open, onClose }: RoleSelectModalProps) => {
    const navigate = useNavigate();
    const [hoveredRole, setHoveredRole] = useState<'influencer' | 'brand' | null>(null);

    const handleInfluencerClick = () => {
        onClose();
        navigate('/influencer-portal/login');
    };

    const handleBrandClick = () => {
        onClose();
        navigate('/login');
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            width={600}
            closeIcon={null}
            className="role-select-modal"
            styles={{
                content: {
                    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '40px',
                },
                mask: {
                    backdropFilter: 'blur(8px)',
                    background: 'rgba(0,0,0,0.7)',
                },
            }}
        >
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">选择您的身份</h2>
                <p className="text-gray-400 text-sm">请选择适合您的入口</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* 我是达人 */}
                <button
                    onClick={handleInfluencerClick}
                    onMouseEnter={() => setHoveredRole('influencer')}
                    onMouseLeave={() => setHoveredRole(null)}
                    className={`
            relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer
            bg-gradient-to-br from-purple-950 to-purple-900
            ${hoveredRole === 'influencer'
                            ? 'border-purple-400 scale-105 shadow-[0_0_30px_rgba(168,85,247,0.4)]'
                            : 'border-purple-600/50 hover:border-purple-400/60'}
          `}
                >
                    <div className="flex flex-col items-center text-center">
                        <div className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all
              ${hoveredRole === 'influencer'
                                ? 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                                : 'bg-purple-700/50'}
            `}>
                            <Users className={`w-8 h-8 ${hoveredRole === 'influencer' ? 'text-white' : 'text-purple-300'}`} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">我是达人</h3>
                        <p className="text-purple-200/80 text-sm mb-4">
                            查看合作邀请、样品状态<br />管理我的合作记录
                        </p>
                        <div className={`
              flex items-center gap-2 text-purple-300 font-medium transition-all
              ${hoveredRole === 'influencer' ? 'translate-x-2 text-purple-200' : ''}
            `}>
                            进入达人端 <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </button>

                {/* 我是品牌/商务 */}
                <button
                    onClick={handleBrandClick}
                    onMouseEnter={() => setHoveredRole('brand')}
                    onMouseLeave={() => setHoveredRole(null)}
                    className={`
            relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer
            bg-gradient-to-br from-blue-950 to-blue-900
            ${hoveredRole === 'brand'
                            ? 'border-blue-400 scale-105 shadow-[0_0_30px_rgba(59,130,246,0.4)]'
                            : 'border-blue-600/50 hover:border-blue-400/60'}
          `}
                >
                    <div className="flex flex-col items-center text-center">
                        <div className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all
              ${hoveredRole === 'brand'
                                ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                                : 'bg-blue-700/50'}
            `}>
                            <Briefcase className={`w-8 h-8 ${hoveredRole === 'brand' ? 'text-white' : 'text-blue-300'}`} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">我是品牌/商务</h3>
                        <p className="text-blue-200/80 text-sm mb-4">
                            管理达人资源、寄样合作<br />数据分析与团队协作
                        </p>
                        <div className={`
              flex items-center gap-2 text-blue-300 font-medium transition-all
              ${hoveredRole === 'brand' ? 'translate-x-2 text-blue-200' : ''}
            `}>
                            进入品牌端 <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </button>
            </div>

            <div className="mt-8 text-center">
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-300 text-sm transition-colors bg-transparent border-0 cursor-pointer"
                >
                    取消
                </button>
            </div>
        </Modal>
    );
};

export default RoleSelectModal;
