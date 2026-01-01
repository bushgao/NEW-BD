import api from './api';

// ==================== 类型定义 ====================

export type ImportType = 'influencers' | 'samples';
export type ExportType = 
  | 'influencers'
  | 'samples'
  | 'dispatches'
  | 'collaborations'
  | 'results'
  | 'staff-performance'
  | 'roi-report'
  | 'sample-cost-report';

// 达人字段映射
export interface InfluencerFieldMapping {
  nickname: string;
  platform: string;
  platformId: string;
  phone?: string;
  categories?: string;
  tags?: string;
  notes?: string;
}

// 样品字段映射
export interface SampleFieldMapping {
  sku: string;
  name: string;
  unitCost: string;
  retailPrice: string;
  canResend?: string;
  notes?: string;
}

export type FieldMapping = InfluencerFieldMapping | SampleFieldMapping;

// 预览行
export interface ImportPreviewRow<T = any> {
  rowNumber: number;
  data: T | null;
  errors: string[];
  isDuplicate: boolean;
  duplicateInfo?: {
    type: string;
    existingId: string;
    existingName: string;
  };
}

// 预览结果
export interface ImportPreviewResult<T = any> {
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
  preview: ImportPreviewRow<T>[];
  headers: string[];
  importType: ImportType;
}

// 导入结果
export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  skippedCount: number;
  errors: { rowNumber: number; error: string }[];
  importType: ImportType;
}

// 解析结果
export interface ParseResult {
  headers: string[];
  suggestedMapping: Partial<FieldMapping>;
  importType: ImportType;
}

// 导出选项
export interface ExportOptions {
  startDate?: string;
  endDate?: string;
  groupBy?: 'influencer' | 'sample' | 'staff' | 'month';
}

// 导出类型标签
export const EXPORT_TYPE_LABELS: Record<ExportType, string> = {
  influencers: '达人列表',
  samples: '样品列表',
  dispatches: '寄样记录',
  collaborations: '合作记录',
  results: '合作结果',
  'staff-performance': '商务绩效报表',
  'roi-report': 'ROI报表',
  'sample-cost-report': '样品成本报表',
};

// 导入类型标签
export const IMPORT_TYPE_LABELS: Record<ImportType, string> = {
  influencers: '达人',
  samples: '样品',
};

// ==================== 导入 API ====================

/**
 * 解析导入文件
 */
export async function parseImportFile(
  file: File,
  type: ImportType = 'influencers'
): Promise<ParseResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await api.post('/import/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

/**
 * 预览导入数据
 */
export async function previewImport<T = any>(
  file: File,
  mapping: FieldMapping,
  type: ImportType = 'influencers'
): Promise<ImportPreviewResult<T>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mapping', JSON.stringify(mapping));
  formData.append('type', type);

  const response = await api.post('/import/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

/**
 * 执行导入
 */
export async function executeImport(
  file: File,
  mapping: FieldMapping,
  type: ImportType = 'influencers',
  skipDuplicates: boolean = true
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mapping', JSON.stringify(mapping));
  formData.append('type', type);
  formData.append('skipDuplicates', String(skipDuplicates));

  const response = await api.post('/import/execute', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

// ==================== 导出 API ====================

/**
 * 下载导入模板
 */
export async function downloadImportTemplate(type: ImportType): Promise<void> {
  const response = await api.get(`/template/${type}`, {
    responseType: 'blob',
  });

  // 从响应头获取文件名
  const contentDisposition = response.headers['content-disposition'];
  let filename = type === 'samples' ? '样品导入模板.xlsx' : '达人导入模板.xlsx';
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
    if (filenameMatch) {
      filename = decodeURIComponent(filenameMatch[1]);
    }
  }

  // 创建下载链接
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * 导出数据
 */
export async function exportData(
  type: ExportType,
  options: ExportOptions = {}
): Promise<void> {
  const params = new URLSearchParams();
  if (options.startDate) params.append('startDate', options.startDate);
  if (options.endDate) params.append('endDate', options.endDate);
  if (options.groupBy) params.append('groupBy', options.groupBy);

  const response = await api.get(`/export/${type}`, {
    params,
    responseType: 'blob',
  });

  // 从响应头获取文件名
  const contentDisposition = response.headers['content-disposition'];
  let filename = `${EXPORT_TYPE_LABELS[type]}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
    if (filenameMatch) {
      filename = decodeURIComponent(filenameMatch[1]);
    }
  }

  // 创建下载链接
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
