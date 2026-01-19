import { useState, useEffect, useCallback } from 'react';
import { Alert, Space, Tag, Spin } from 'antd';
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import api from '../../services/api';

// 类型定义
export interface ValidationError {
  field: string;
  message: string;
  type: 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  type: 'warning';
}

export interface ValidationInfo {
  field: string;
  message: string;
  type: 'info';
}

export type ValidationIssue = ValidationError | ValidationWarning | ValidationInfo;

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  infos: ValidationInfo[];
  duplicates?: DuplicateCheck[];
  anomalies?: AnomalyCheck[];
}

export interface DuplicateCheck {
  field: string;
  value: any;
  existingRecordId: string;
  existingRecordInfo: string;
  message: string;
}

export interface AnomalyCheck {
  field: string;
  value: any;
  expectedRange?: { min: number; max: number };
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export interface FormValidatorProps {
  form: FormInstance;
  type: 'collaboration' | 'dispatch' | 'result';
  onValidationChange?: (result: ValidationResult) => void;
  realTimeValidation?: boolean;
  showSummary?: boolean;
}

/**
 * FormValidator 组件
 * 提供实时数据验证、重复数据检测、异常数据提醒
 */
const FormValidator: React.FC<FormValidatorProps> = ({
  form,
  type,
  onValidationChange,
  realTimeValidation = true,
  showSummary = true,
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    infos: [],
    duplicates: [],
    anomalies: [],
  });
  const [isValidating, setIsValidating] = useState(false);

  // 执行验证
  const performValidation = useCallback(async (values: any) => {
    if (!values || Object.keys(values).length === 0) {
      return;
    }

    setIsValidating(true);

    try {
      const response = await api.post('/collaborations/validate', {
        type,
        data: values,
      });

      if (response.data.success) {
        const result: ValidationResult = response.data.data;
        setValidationResult(result);
        onValidationChange?.(result);
      }
    } catch (error: any) {
      console.error('Validation failed:', error);

      // 如果验证API失败，至少执行基本的前端验证
      const basicResult = performBasicValidation(values);
      setValidationResult(basicResult);
      onValidationChange?.(basicResult);
    } finally {
      setIsValidating(false);
    }
  }, [type, onValidationChange]);

  // 基本前端验证（作为后备）
  const performBasicValidation = (values: any): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const infos: ValidationInfo[] = [];

    // 根据表单类型执行不同的验证
    if (type === 'collaboration') {
      // 验证必填字段
      if (!values.influencerId) {
        errors.push({
          field: 'influencerId',
          message: '请选择达人',
          type: 'error',
        });
      }

      if (!values.stage) {
        errors.push({
          field: 'stage',
          message: '请选择合作阶段',
          type: 'error',
        });
      }

      // 验证截止日期
      if (values.deadline) {
        const deadline = new Date(values.deadline);
        const now = new Date();

        if (deadline < now) {
          warnings.push({
            field: 'deadline',
            message: '截止日期已过期',
            type: 'warning',
          });
        }
      }

      // 验证报价
      if (values.quotedPrice !== undefined && values.quotedPrice !== null) {
        if (values.quotedPrice < 0) {
          errors.push({
            field: 'quotedPrice',
            message: '报价不能为负数',
            type: 'error',
          });
        } else if (values.quotedPrice === 0) {
          warnings.push({
            field: 'quotedPrice',
            message: '报价为0，请确认是否正确',
            type: 'warning',
          });
        } else if (values.quotedPrice > 100000) {
          warnings.push({
            field: 'quotedPrice',
            message: '报价较高，请确认是否正确',
            type: 'warning',
          });
        }
      }
    } else if (type === 'dispatch') {
      // 寄样验证
      if (!values.sampleId) {
        errors.push({
          field: 'sampleId',
          message: '请选择样品',
          type: 'error',
        });
      }

      if (!values.influencerId) {
        errors.push({
          field: 'influencerId',
          message: '请选择达人',
          type: 'error',
        });
      }

      if (!values.quantity || values.quantity <= 0) {
        errors.push({
          field: 'quantity',
          message: '数量必须大于0',
          type: 'error',
        });
      }
    } else if (type === 'result') {
      // 结果录入验证
      if (!values.views || values.views < 0) {
        errors.push({
          field: 'views',
          message: '播放量不能为负数',
          type: 'error',
        });
      }

      if (values.likes !== undefined && values.likes < 0) {
        errors.push({
          field: 'likes',
          message: '点赞数不能为负数',
          type: 'error',
        });
      }

      if (values.comments !== undefined && values.comments < 0) {
        errors.push({
          field: 'comments',
          message: '评论数不能为负数',
          type: 'error',
        });
      }

      // 检查异常数据
      if (values.views && values.likes) {
        const likeRate = values.likes / values.views;
        if (likeRate > 0.5) {
          warnings.push({
            field: 'likes',
            message: '点赞率异常高（>50%），请确认数据是否正确',
            type: 'warning',
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos,
      duplicates: [],
      anomalies: [],
    };
  };

  // 监听表单值变化 - 只在组件挂载时执行一次验证
  useEffect(() => {
    if (!realTimeValidation) {
      return;
    }

    // 只执行一次初始验证
    const values = form.getFieldsValue();
    if (values && Object.keys(values).length > 0) {
      performValidation(values);
    }
    // 注意：不在依赖中加入 debouncedValidation 以避免无限循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realTimeValidation]);

  // 手动触发验证
  const validate = useCallback(async () => {
    const values = form.getFieldsValue();
    await performValidation(values);
  }, [form, performValidation]);

  // 暴露验证方法给父组件
  useEffect(() => {
    // 将验证方法附加到form实例上
    (form as any).validateData = validate;
  }, [form, validate]);

  // 渲染验证摘要
  const renderSummary = () => {
    if (!showSummary) {
      return null;
    }

    const { errors, warnings, infos, duplicates, anomalies } = validationResult;
    const hasIssues = errors.length > 0 || warnings.length > 0 ||
      (duplicates && duplicates.length > 0) ||
      (anomalies && anomalies.length > 0);

    if (!hasIssues && infos.length === 0) {
      return null;
    }

    return (
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        {/* 错误提示 */}
        {errors.length > 0 && (
          <Alert
            type="error"
            icon={<ExclamationCircleOutlined />}
            message={`发现 ${errors.length} 个错误`}
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            }
            showIcon
          />
        )}

        {/* 重复数据提示 */}
        {duplicates && duplicates.length > 0 && (
          <Alert
            type="warning"
            icon={<WarningOutlined />}
            message={`发现 ${duplicates.length} 个重复数据`}
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {duplicates.map((dup, index) => (
                  <li key={index}>
                    {dup.message}
                    <br />
                    <small style={{ color: '#666' }}>
                      已存在记录：{dup.existingRecordInfo}
                    </small>
                  </li>
                ))}
              </ul>
            }
            showIcon
          />
        )}

        {/* 异常数据提示 */}
        {anomalies && anomalies.length > 0 && (
          <Alert
            type="warning"
            icon={<WarningOutlined />}
            message={`发现 ${anomalies.length} 个异常数据`}
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {anomalies.map((anomaly, index) => (
                  <li key={index}>
                    <Space>
                      <Tag color={
                        anomaly.severity === 'high' ? 'red' :
                          anomaly.severity === 'medium' ? 'orange' : 'default'
                      }>
                        {anomaly.severity === 'high' ? '严重' :
                          anomaly.severity === 'medium' ? '中等' : '轻微'}
                      </Tag>
                      {anomaly.message}
                    </Space>
                  </li>
                ))}
              </ul>
            }
            showIcon
          />
        )}

        {/* 警告提示 */}
        {warnings.length > 0 && (
          <Alert
            type="warning"
            icon={<WarningOutlined />}
            message={`${warnings.length} 个警告`}
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {warnings.map((warning, index) => (
                  <li key={index}>{warning.message}</li>
                ))}
              </ul>
            }
            showIcon
          />
        )}

        {/* 信息提示 */}
        {infos.length > 0 && (
          <Alert
            type="info"
            icon={<InfoCircleOutlined />}
            message="提示信息"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {infos.map((info, index) => (
                  <li key={index}>{info.message}</li>
                ))}
              </ul>
            }
            showIcon
          />
        )}

        {/* 验证通过提示 */}
        {!hasIssues && infos.length === 0 && (
          <Alert
            type="success"
            icon={<CheckCircleOutlined />}
            message="数据验证通过"
            showIcon
          />
        )}
      </Space>
    );
  };

  return (
    <Spin spinning={isValidating} tip="正在验证数据...">
      {renderSummary()}
    </Spin>
  );
};

export default FormValidator;
