import * as XLSX from 'xlsx';

// ==================== 导入模板生成服务 ====================

export type TemplateType = 'influencers' | 'samples';

/**
 * 生成达人导入模板
 */
function generateInfluencerTemplate(): Buffer {
  const headers = [
    '昵称',
    '平台',
    '平台账号ID',
    '手机号',
    '类目',
    '标签',
    '备注',
  ];

  const exampleData = [
    {
      '昵称': '示例达人1',
      '平台': '抖音',
      '平台账号ID': 'dy_123456',
      '手机号': '13800138001',
      '类目': '美妆,护肤',
      '标签': '高配合度,价格合理',
      '备注': '合作过3次，效果不错',
    },
    {
      '昵称': '示例达人2',
      '平台': '小红书',
      '平台账号ID': 'xhs_789012',
      '手机号': '13800138002',
      '类目': '服饰,穿搭',
      '标签': '内容优质',
      '备注': '',
    },
  ];

  const instructions = [
    { '说明': '【填写说明】' },
    { '说明': '1. 昵称、平台、平台账号ID 为必填项' },
    { '说明': '2. 平台可选值：抖音、快手、小红书、微博、其他' },
    { '说明': '3. 类目和标签可用逗号分隔多个值' },
    { '说明': '4. 请删除本说明行后再导入' },
  ];

  const workbook = XLSX.utils.book_new();
  
  // 数据表
  const dataSheet = XLSX.utils.json_to_sheet(exampleData, { header: headers });
  dataSheet['!cols'] = [
    { wch: 15 }, // 昵称
    { wch: 10 }, // 平台
    { wch: 20 }, // 平台账号ID
    { wch: 15 }, // 手机号
    { wch: 20 }, // 类目
    { wch: 20 }, // 标签
    { wch: 30 }, // 备注
  ];
  XLSX.utils.book_append_sheet(workbook, dataSheet, '达人数据');

  // 说明表
  const instructionSheet = XLSX.utils.json_to_sheet(instructions);
  instructionSheet['!cols'] = [{ wch: 50 }];
  XLSX.utils.book_append_sheet(workbook, instructionSheet, '填写说明');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * 生成样品导入模板
 */
function generateSampleTemplate(): Buffer {
  const headers = [
    'SKU',
    '名称',
    '单件成本（元）',
    '建议零售价（元）',
    '可复寄',
    '备注',
  ];

  const exampleData = [
    {
      'SKU': 'SKU001',
      '名称': '示例面膜套装',
      '单件成本（元）': '25.50',
      '建议零售价（元）': '99.00',
      '可复寄': '是',
      '备注': '热销款',
    },
    {
      'SKU': 'SKU002',
      '名称': '示例精华液',
      '单件成本（元）': '35.00',
      '建议零售价（元）': '168.00',
      '可复寄': '否',
      '备注': '限量版',
    },
  ];

  const instructions = [
    { '说明': '【填写说明】' },
    { '说明': '1. SKU、名称、单件成本、建议零售价 为必填项' },
    { '说明': '2. 成本和价格请填写数字，单位为元（如：25.50）' },
    { '说明': '3. 可复寄填写"是"或"否"，不填默认为"否"' },
    { '说明': '4. 请删除本说明行后再导入' },
  ];

  const workbook = XLSX.utils.book_new();
  
  // 数据表
  const dataSheet = XLSX.utils.json_to_sheet(exampleData, { header: headers });
  dataSheet['!cols'] = [
    { wch: 15 }, // SKU
    { wch: 25 }, // 名称
    { wch: 18 }, // 单件成本
    { wch: 18 }, // 建议零售价
    { wch: 10 }, // 可复寄
    { wch: 30 }, // 备注
  ];
  XLSX.utils.book_append_sheet(workbook, dataSheet, '样品数据');

  // 说明表
  const instructionSheet = XLSX.utils.json_to_sheet(instructions);
  instructionSheet['!cols'] = [{ wch: 50 }];
  XLSX.utils.book_append_sheet(workbook, instructionSheet, '填写说明');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * 生成导入模板
 */
export function generateImportTemplate(type: TemplateType): { buffer: Buffer; filename: string } {
  let buffer: Buffer;
  let filename: string;

  switch (type) {
    case 'influencers':
      buffer = generateInfluencerTemplate();
      filename = '达人导入模板.xlsx';
      break;
    case 'samples':
      buffer = generateSampleTemplate();
      filename = '样品导入模板.xlsx';
      break;
    default:
      throw new Error(`不支持的模板类型: ${type}`);
  }

  return { buffer, filename };
}
