import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  message,
  Alert,
  Space,
  Button,
  Tag,
  Tooltip,
  Spin,
} from 'antd';
import { BulbOutlined, HistoryOutlined } from '@ant-design/icons';
import {
  createCollaboration,
  STAGE_LABELS,
  STAGE_ORDER,
  getCollaborationSuggestions,
} from '../../services/collaboration.service';
import { PLATFORM_LABELS, type Influencer } from '../../services/influencer.service';
import { getSamples, type Sample } from '../../services/sample.service';
import FormValidator, { type ValidationResult } from '../../components/forms/FormValidator';
import dayjs from 'dayjs';

interface CreateCollaborationModalProps {
  visible: boolean;
  influencers: Influencer[];
  onClose: (refresh?: boolean) => void;
}

interface Suggestion {
  field: string;
  value: any;
  label: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

const CACHE_KEY = 'smart_form_draft_collaboration';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

const CreateCollaborationModal = ({
  visible,
  influencers,
  onClose,
}: CreateCollaborationModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // 加载样品列表
  useEffect(() => {
    const loadSamples = async () => {
      try {
        const result = await getSamples({ page: 1, pageSize: 100 });
        setSamples(result.data);
      } catch (error) {
        console.error('Failed to load samples:', error);
      }
    };
    if (visible) {
      loadSamples();
    }
  }, [visible]);

  // 从缓存加载草稿
  const loadDraft = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        if (now - timestamp < CACHE_EXPIRY) {
          return data;
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  }, []);

  // 保存草稿
  const saveDraft = useCallback((data: any) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, []);

  // 清除草稿
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);

  // 初始化表单
  useEffect(() => {
    if (visible) {
      const draft = loadDraft();
      if (draft) {
        form.setFieldsValue({
          ...draft,
          deadline: draft.deadline ? dayjs(draft.deadline) : undefined,
        });
        setIsDirty(true);
        message.info('已恢复上次编辑的草稿');
      } else {
        form.setFieldsValue({ stage: 'LEAD' });
      }
    }
  }, [visible, form, loadDraft]);

  // 加载智能建议
  const loadSuggestions = useCallback(async (influencerId: string) => {
    if (!influencerId) {
      console.log('loadSuggestions: 没有达人 ID');
      return;
    }

    console.log('loadSuggestions: 开始加载建议，达人 ID:', influencerId);
    setLoadingSuggestions(true);
    
    try {
      // 并行加载三种类型的建议
      console.log('loadSuggestions: 发起 API 请求...');
      const [sampleSuggestions, priceSuggestions, scheduleSuggestions] = await Promise.all([
        getCollaborationSuggestions(influencerId, 'sample').catch(err => {
          console.error('样品建议加载失败:', err);
          return { type: 'sample' as const, suggestions: [] };
        }),
        getCollaborationSuggestions(influencerId, 'price').catch(err => {
          console.error('报价建议加载失败:', err);
          return { type: 'price' as const, suggestions: [] };
        }),
        getCollaborationSuggestions(influencerId, 'schedule').catch(err => {
          console.error('排期建议加载失败:', err);
          return { type: 'schedule' as const, suggestions: [] };
        }),
      ]);

      console.log('loadSuggestions: API 响应:', {
        sample: sampleSuggestions,
        price: priceSuggestions,
        schedule: scheduleSuggestions,
      });

      const allSuggestions = [
        ...sampleSuggestions.suggestions,
        ...priceSuggestions.suggestions,
        ...scheduleSuggestions.suggestions,
      ];

      console.log('loadSuggestions: 合并后的建议数量:', allSuggestions.length);
      setSuggestions(allSuggestions);
      
      if (allSuggestions.length > 0) {
        message.success(`已加载 ${allSuggestions.length} 条智能建议`);
      } else {
        message.info('暂无智能建议，您可以手动填写');
      }
    } catch (error) {
      console.error('loadSuggestions: 加载建议失败:', error);
      message.error('加载智能建议失败，请手动填写');
    } finally {
      setLoadingSuggestions(false);
      console.log('loadSuggestions: 加载完成');
    }
  }, []);

  // 达人选择变化时加载建议
  const handleInfluencerChange = (influencerId: string) => {
    console.log('handleInfluencerChange: 达人选择变化:', influencerId);
    setSelectedInfluencer(influencerId);
    
    // 🔥 临时添加测试建议 - 用于验证 UI 是否正常
    setSuggestions([
      {
        field: 'sampleId',
        value: 'test-sample-1',
        label: '测试样品A（历史最佳）',
        reason: '该达人使用此样品平均GMV为 ¥5000，效果最好',
        confidence: 'high' as const,
      },
      {
        field: 'quotedPrice',
        value: 1500,
        label: '¥1500（历史平均）',
        reason: '该达人历史平均报价为 ¥1500',
        confidence: 'high' as const,
      },
      {
        field: 'deadline',
        value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        label: '一周后 20:00（黄金时段）',
        reason: '黄金时段，用户活跃度最高',
        confidence: 'medium' as const,
      },
    ]);
    
    // 同时调用真实的 API
    loadSuggestions(influencerId);
  };

  // 表单值变化时自动保存草稿
  const handleValuesChange = (changedValues: any, allValues: any) => {
    setIsDirty(true);
    
    // 防抖保存
    const timeoutId = setTimeout(() => {
      const draftData = {
        ...allValues,
        deadline: allValues.deadline?.toISOString(),
      };
      saveDraft(draftData);
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  // 应用建议
  const applySuggestion = (suggestion: Suggestion) => {
    if (suggestion.field === 'scheduledDate') {
      form.setFieldValue('deadline', dayjs(suggestion.value));
    } else {
      form.setFieldValue(suggestion.field, suggestion.value);
    }
    
    setSuggestions(prev => prev.filter(s => s.field !== suggestion.field));
    message.success(`已应用建议：${suggestion.label}`);
  };

  // 忽略建议
  const dismissSuggestion = (field: string) => {
    setSuggestions(prev => prev.filter(s => s.field !== field));
  };

  // 处理验证结果变化
  const handleValidationChange = (result: ValidationResult) => {
    setValidationResult(result);
  };

  const handleSubmit = async () => {
    try {
      // 先执行表单验证
      const values = await form.validateFields();
      
      // 检查数据验证结果
      if (validationResult && !validationResult.isValid) {
        message.error('请修正表单中的错误后再提交');
        return;
      }

      // 如果有重复数据警告，询问用户是否继续
      if (validationResult && validationResult.duplicates && validationResult.duplicates.length > 0) {
        Modal.confirm({
          title: '发现重复数据',
          content: '该达人已有进行中的合作记录，是否继续创建新的合作？',
          onOk: async () => {
            await submitForm(values);
          },
        });
        return;
      }

      await submitForm(values);
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(error.response?.data?.error?.message || '创建失败');
    }
  };

  const submitForm = async (values: any) => {
    try {
      setLoading(true);

      await createCollaboration({
        influencerId: values.influencerId,
        stage: values.stage,
        deadline: values.deadline?.toISOString(),
        notes: values.notes,
      });

      message.success('合作记录已创建');
      form.resetFields();
      clearDraft();
      setIsDirty(false);
      setSuggestions([]);
      setValidationResult(null);
      onClose(true);
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '创建失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const values = form.getFieldsValue();
      const draftData = {
        ...values,
        deadline: values.deadline?.toISOString(),
      };
      saveDraft(draftData);
      message.info('草稿已保存');
    }
    
    form.resetFields();
    setIsDirty(false);
    setSuggestions([]);
    setSelectedInfluencer(null);
    onClose();
  };

  // 渲染建议卡片
  const renderSuggestions = () => {
    if (suggestions.length === 0) {
      return null;
    }

    return (
      <Alert
        type="info"
        icon={<BulbOutlined />}
        message="智能建议"
        description={
          <Spin spinning={loadingSuggestions}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {suggestions.map((suggestion, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <Tag color={
                      suggestion.confidence === 'high' ? 'green' :
                      suggestion.confidence === 'medium' ? 'orange' : 'default'
                    }>
                      {suggestion.confidence === 'high' ? '强烈推荐' :
                       suggestion.confidence === 'medium' ? '建议' : '可选'}
                    </Tag>
                    <Tooltip title={suggestion.reason}>
                      <span>{suggestion.label}</span>
                    </Tooltip>
                  </Space>
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      应用
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => dismissSuggestion(suggestion.field)}
                    >
                      忽略
                    </Button>
                  </Space>
                </div>
              ))}
            </Space>
          </Spin>
        }
        style={{ marginBottom: 16 }}
      />
    );
  };

  // 渲染草稿提示
  const renderDraftIndicator = () => {
    if (!isDirty) {
      return null;
    }

    return (
      <Alert
        type="warning"
        icon={<HistoryOutlined />}
        message="有未保存的更改"
        description="表单内容会自动保存为草稿，您可以随时返回继续编辑"
        closable
        style={{ marginBottom: 16 }}
      />
    );
  };

  return (
    <Modal
      title="新建合作"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="创建"
      cancelText="取消"
      width={600}
    >
      {renderDraftIndicator()}
      {renderSuggestions()}
      
      {/* 数据验证组件 */}
      <FormValidator
        form={form}
        type="collaboration"
        onValidationChange={handleValidationChange}
        realTimeValidation={true}
        showSummary={true}
      />
      
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={{
          stage: 'LEAD',
        }}
      >
        <Form.Item
          name="influencerId"
          label="选择达人"
          rules={[{ required: true, message: '请选择达人' }]}
        >
          <Select
            showSearch
            placeholder="搜索并选择达人"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            onChange={handleInfluencerChange}
            options={influencers.map((inf) => ({
              value: inf.id,
              label: `${inf.nickname} (${PLATFORM_LABELS[inf.platform]} - ${inf.platformId})`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="stage"
          label="初始阶段"
          rules={[{ required: true, message: '请选择初始阶段' }]}
        >
          <Select
            options={STAGE_ORDER.map((stage) => ({
              value: stage,
              label: STAGE_LABELS[stage],
            }))}
          />
        </Form.Item>

        <Form.Item name="sampleId" label="推荐样品">
          <Select
            placeholder="选择样品（可选）"
            allowClear
            options={samples.map((sample) => ({
              value: sample.id,
              label: sample.name,
            }))}
          />
        </Form.Item>

        <Form.Item name="quotedPrice" label="报价">
          <Input
            type="number"
            placeholder="输入报价金额（可选）"
            prefix="¥"
            min={0}
          />
        </Form.Item>

        <Form.Item name="deadline" label="截止时间">
          <DatePicker
            showTime
            placeholder="选择截止时间（可选）"
            style={{ width: '100%' }}
            format="YYYY-MM-DD HH:mm"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Form.Item name="notes" label="备注">
          <Input.TextArea
            placeholder="输入备注信息（可选）"
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateCollaborationModal;
