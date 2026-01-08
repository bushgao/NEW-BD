/**
 * 商务权限设置弹窗
 */

import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Checkbox,
  Radio,
  Space,
  Typography,
  Divider,
  message,
  Alert,
  Spin,
} from 'antd';
import type { StaffPermissions } from '../../hooks/usePermissions';
import {
  getStaffPermissions,
  updateStaffPermissions,
  getPermissionTemplates,
  type PermissionTemplate,
} from '../../services/staff-management.service';

const { Title, Text, Paragraph } = Typography;

interface StaffPermissionsModalProps {
  visible: boolean;
  staffId: string;
  staffName: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const StaffPermissionsModal = ({
  visible,
  staffId,
  staffName,
  onCancel,
  onSuccess,
}: StaffPermissionsModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('basic');
  const [permissions, setPermissions] = useState<StaffPermissions | null>(null);

  // 加载权限模板和当前权限
  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, staffId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, permissionsData] = await Promise.all([
        getPermissionTemplates(),
        getStaffPermissions(staffId),
      ]);

      setTemplates(templatesData);
      setPermissions(permissionsData.permissions);
      setSelectedTemplate(permissionsData.template);

      // 设置表单初始值
      form.setFieldsValue(permissionsData.permissions);
    } catch (error) {
      message.error('加载权限数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 应用模板
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);

    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setPermissions(template.permissions);
      form.setFieldsValue(template.permissions);
    }
  };

  // 保存权限
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      await updateStaffPermissions(staffId, values);

      message.success('权限更新成功');
      onSuccess();
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      message.error(error.message || '权限更新失败');
    } finally {
      setSaving(false);
    }
  };

  // 权限变更时，检查是否还匹配模板
  const handlePermissionChange = () => {
    const currentValues = form.getFieldsValue();
    
    // 检查是否匹配某个模板
    const matchedTemplate = templates.find((t) => {
      if (t.id === 'custom') return false;
      return JSON.stringify(t.permissions) === JSON.stringify(currentValues);
    });

    setSelectedTemplate(matchedTemplate?.id || 'custom');
  };

  return (
    <Modal
      title={`设置权限 - ${staffName}`}
      open={visible}
      onCancel={onCancel}
      onOk={handleSave}
      confirmLoading={saving}
      width={800}
      okText="保存并应用"
      cancelText="取消"
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Alert
            message="权限说明"
            description="修改权限后立即生效，商务人员无需重新登录。工厂老板始终拥有所有权限。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          {/* 权限模板选择 */}
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>快速选择模板</Title>
            <Radio.Group
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {templates.map((template) => (
                  <Radio key={template.id} value={template.id} style={{ width: '100%' }}>
                    <div>
                      <Text strong>{template.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {template.description}
                      </Text>
                    </div>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>

          <Divider />

          {/* 详细权限配置 */}
          <Form
            form={form}
            layout="vertical"
            initialValues={permissions || undefined}
            onValuesChange={handlePermissionChange}
          >
            {/* 数据可见性权限 */}
            <Title level={5}>数据可见性权限</Title>
            <Paragraph type="secondary" style={{ fontSize: 12 }}>
              控制商务可以查看哪些数据
            </Paragraph>

            <Form.Item name={['dataVisibility', 'viewOthersInfluencers']} valuePropName="checked">
              <Checkbox>查看其他商务的达人信息</Checkbox>
            </Form.Item>

            <Form.Item
              name={['dataVisibility', 'viewOthersCollaborations']}
              valuePropName="checked"
            >
              <Checkbox>查看其他商务的合作记录</Checkbox>
            </Form.Item>

            <Form.Item name={['dataVisibility', 'viewOthersPerformance']} valuePropName="checked">
              <Checkbox>查看其他商务的业绩数据</Checkbox>
            </Form.Item>

            <Form.Item name={['dataVisibility', 'viewTeamData']} valuePropName="checked">
              <Checkbox>查看团队整体数据</Checkbox>
            </Form.Item>

            <Form.Item name={['dataVisibility', 'viewRanking']} valuePropName="checked">
              <Checkbox>查看排行榜</Checkbox>
            </Form.Item>

            <Divider />

            {/* 操作权限 */}
            <Title level={5}>操作权限</Title>
            <Paragraph type="secondary" style={{ fontSize: 12 }}>
              控制商务可以执行哪些操作
            </Paragraph>

            <Form.Item name={['operations', 'manageInfluencers']} valuePropName="checked">
              <Checkbox>创建/编辑/删除达人</Checkbox>
            </Form.Item>

            <Form.Item name={['operations', 'manageSamples']} valuePropName="checked">
              <Checkbox>创建/编辑/删除样品</Checkbox>
            </Form.Item>

            <Form.Item name={['operations', 'manageCollaborations']} valuePropName="checked">
              <Checkbox>创建/编辑合作记录</Checkbox>
            </Form.Item>

            <Form.Item name={['operations', 'deleteCollaborations']} valuePropName="checked">
              <Checkbox>删除合作记录</Checkbox>
            </Form.Item>

            <Form.Item name={['operations', 'exportData']} valuePropName="checked">
              <Checkbox>导出数据</Checkbox>
            </Form.Item>

            <Form.Item name={['operations', 'batchOperations']} valuePropName="checked">
              <Checkbox>批量操作</Checkbox>
            </Form.Item>

            <Divider />

            {/* 高级权限 */}
            <Title level={5}>高级权限</Title>
            <Paragraph type="secondary" style={{ fontSize: 12 }}>
              敏感数据和高级功能权限
            </Paragraph>

            <Form.Item name={['advanced', 'viewCostData']} valuePropName="checked">
              <Checkbox>查看成本数据</Checkbox>
            </Form.Item>

            <Form.Item name={['advanced', 'viewROIData']} valuePropName="checked">
              <Checkbox>查看ROI数据</Checkbox>
            </Form.Item>

            <Form.Item name={['advanced', 'modifyOthersData']} valuePropName="checked">
              <Checkbox>修改其他商务的数据</Checkbox>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};

export default StaffPermissionsModal;
