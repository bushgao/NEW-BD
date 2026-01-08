import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Select, DatePicker, Button, Space, Alert, Spin, Tag, Tooltip, message } from 'antd';
import { SaveOutlined, BulbOutlined, HistoryOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import FormValidator, { type ValidationResult } from './FormValidator';
import dayjs from 'dayjs';

// 类型定义
export interface Suggestion {
  field: string;
  value: any;
  label: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface SmartFormProps {
  type: 'collaboration' | 'dispatch' | 'result';
  initialData?: any;
  autoFill?: boolean;
  suggestions?: boolean;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  form?: FormInstance;
}

interface SmartFormState {
  data: any;
  suggestions: Suggestion[];
  validationErrors: ValidationError[];
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  validationResult: ValidationResult | null;
}

const CACHE_PREFIX = 'smart_form_draft_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

/**
 * SmartForm 组件
 * 智能表单，支持自动填充、智能推荐、表单缓存
 */
const SmartForm: React.FC<SmartFormProps> = ({
  type,
  initialData,
  autoFill = true,
  suggestions: enableSuggestions = true,
  onSubmit,
  onCancel,
  form: externalForm,
}) => {
  const [internalForm] = Form.useForm();
  const form = externalForm || internalForm;

  const [state, setState] = useState<SmartFormState>({
    data: initialData || {},
    suggestions: [],
    validationErrors: [],
    isDirty: false,
    isLoading: false,
    isSaving: false,
    validationResult: null,
  });

  const cacheKey = `${CACHE_PREFIX}${type}`;

  // 从缓存加载草稿
  const loadDraft = useCallback(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // 检查缓存是否过期
        if (now - timestamp < CACHE_EXPIRY) {
          return data;
        } else {
          // 清除过期缓存
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  }, [cacheKey]);

  // 保存草稿到缓存
  const saveDraft = useCallback((data: any) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [cacheKey]);

  // 清除草稿
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [cacheKey]);

  // 初始化表单数据
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
      setState(prev => ({ ...prev, data: initialData }));
    } else {
      // 尝试从缓存加载草稿
      const draft = loadDraft();
      if (draft) {
        form.setFieldsValue(draft);
        setState(prev => ({ ...prev, data: draft, isDirty: true }));
        message.info('已恢复上次编辑的草稿');
      }
    }
  }, [initialData, form, loadDraft]);

  // 表单值变化时自动保存草稿
  const handleValuesChange = useCallback((changedValues: any, allValues: any) => {
    setState(prev => ({ ...prev, data: allValues, isDirty: true }));
    
    // 自动保存草稿（防抖）
    const timeoutId = setTimeout(() => {
      saveDraft(allValues);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [saveDraft]);

  // 应用建议
  const applySuggestion = useCallback((suggestion: Suggestion) => {
    form.setFieldValue(suggestion.field, suggestion.value);
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.field !== suggestion.field),
      isDirty: true,
    }));
    message.success(`已应用建议：${suggestion.label}`);
  }, [form]);

  // 忽略建议
  const dismissSuggestion = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.field !== field),
    }));
  }, []);

  // 处理验证结果变化
  const handleValidationChange = useCallback((result: ValidationResult) => {
    setState(prev => ({ ...prev, validationResult: result }));
  }, []);

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 检查数据验证结果
      if (state.validationResult && !state.validationResult.isValid) {
        message.error('请修正表单中的错误后再提交');
        return;
      }
      
      setState(prev => ({ ...prev, isSaving: true }));
      
      await onSubmit(values);
      
      // 提交成功后清除草稿
      clearDraft();
      setState(prev => ({ ...prev, isDirty: false, isSaving: false, validationResult: null }));
      message.success('提交成功');
    } catch (error: any) {
      setState(prev => ({ ...prev, isSaving: false }));
      
      if (error.errorFields) {
        // 表单验证错误
        message.error('请检查表单填写是否正确');
      } else {
        // 提交错误
        message.error(error.message || '提交失败');
      }
    }
  };

  // 取消编辑
  const handleCancel = () => {
    if (state.isDirty) {
      // 保存草稿
      const values = form.getFieldsValue();
      saveDraft(values);
      message.info('草稿已保存');
    }
    onCancel?.();
  };

  // 渲染建议卡片
  const renderSuggestions = () => {
    if (!enableSuggestions || state.suggestions.length === 0) {
      return null;
    }

    return (
      <Alert
        type="info"
        icon={<BulbOutlined />}
        message="智能建议"
        description={
          <Space direction="vertical" style={{ width: '100%' }}>
            {state.suggestions.map((suggestion, index) => (
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
        }
        style={{ marginBottom: 16 }}
      />
    );
  };

  // 渲染草稿提示
  const renderDraftIndicator = () => {
    if (!state.isDirty) {
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
    <Spin spinning={state.isLoading}>
      <div>
        {renderDraftIndicator()}
        {renderSuggestions()}
        
        {/* 数据验证组件 */}
        <FormValidator
          form={form}
          type={type}
          onValidationChange={handleValidationChange}
          realTimeValidation={true}
          showSummary={true}
        />
        
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleValuesChange}
          initialValues={state.data}
        >
          {/* 表单内容由父组件通过 children 传入 */}
        </Form>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            {onCancel && (
              <Button onClick={handleCancel}>
                取消
              </Button>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={state.isSaving}
              onClick={handleSubmit}
            >
              提交
            </Button>
          </Space>
        </div>
      </div>
    </Spin>
  );
};

export default SmartForm;
