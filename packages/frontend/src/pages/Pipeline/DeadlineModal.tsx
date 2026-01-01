import { useState, useEffect } from 'react';
import { Modal, DatePicker, Button, message } from 'antd';
import { setDeadline, type CollaborationCard } from '../../services/collaboration.service';
import dayjs, { Dayjs } from 'dayjs';

interface DeadlineModalProps {
  visible: boolean;
  collaboration: CollaborationCard | null;
  onClose: (refresh?: boolean) => void;
}

const DeadlineModal = ({ visible, collaboration, onClose }: DeadlineModalProps) => {
  const [loading, setLoading] = useState(false);
  const [deadline, setDeadlineState] = useState<Dayjs | null>(null);

  useEffect(() => {
    if (visible && collaboration) {
      setDeadlineState(collaboration.deadline ? dayjs(collaboration.deadline) : null);
    }
  }, [visible, collaboration]);

  const handleSave = async () => {
    if (!collaboration) return;

    setLoading(true);
    try {
      await setDeadline(
        collaboration.id,
        deadline ? deadline.toISOString() : null
      );
      message.success('截止时间已更新');
      onClose(true);
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!collaboration) return;

    setLoading(true);
    try {
      await setDeadline(collaboration.id, null);
      message.success('截止时间已清除');
      onClose(true);
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '清除失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`设置截止时间 - ${collaboration?.influencer.nickname || ''}`}
      open={visible}
      onCancel={() => onClose()}
      footer={[
        <Button key="clear" onClick={handleClear} loading={loading} disabled={!collaboration?.deadline}>
          清除截止时间
        </Button>,
        <Button key="cancel" onClick={() => onClose()}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={loading}>
          保存
        </Button>,
      ]}
    >
      <div style={{ padding: '20px 0' }}>
        <DatePicker
          showTime
          value={deadline}
          onChange={setDeadlineState}
          placeholder="选择截止时间"
          style={{ width: '100%' }}
          format="YYYY-MM-DD HH:mm"
          disabledDate={(current) => current && current < dayjs().startOf('day')}
        />
      </div>
    </Modal>
  );
};

export default DeadlineModal;
