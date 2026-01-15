import { useState, useMemo, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    InputNumber,
    Statistic,
    Typography,
    Divider,
    Tooltip,
    Space,
    Alert,
    Switch,
    Select,
    message,
} from 'antd';
import {
    CalculatorOutlined,
    QuestionCircleOutlined,
    RiseOutlined,
    FallOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    ShoppingOutlined,
} from '@ant-design/icons';
import { getSamples, type Sample } from '../../services/sample.service';

const { Title, Text, Paragraph } = Typography;

interface CostInputs {
    sampleCost: number;        // 样品成本（元）
    packagingCost: number;     // 包装成本（元）
    shippingCost: number;      // 快递成本（元）
    pitFee: number;            // 坑位费（元）
    commissionRate: number;    // 佣金率 (%)
    platformFeeRate: number;   // 平台扣点 (%)
    taxRate: number;           // 税费 (%)
    unitCost: number;          // 单品成本（元）
    unitPrice: number;         // 单品售价（元）
    returnRate: number;        // 退货率 (%)
    hiddenCost: number;        // 隐形成本（元）
    expectedSales: number;     // 预期销售额（元）
}

const defaultInputs: CostInputs = {
    sampleCost: 0,
    packagingCost: 0,
    shippingCost: 0,
    pitFee: 0,
    commissionRate: 20,
    platformFeeRate: 6,
    taxRate: 0,
    unitCost: 0,
    unitPrice: 0,
    returnRate: 30,
    hiddenCost: 0,
    expectedSales: 0,
};

const RoiCalculatorPage = () => {
    const [inputs, setInputs] = useState<CostInputs>(defaultInputs);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [samples, setSamples] = useState<Sample[]>([]);
    const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
    const [loadingSamples, setLoadingSamples] = useState(false);

    // 加载样品列表
    useEffect(() => {
        const loadSamples = async () => {
            setLoadingSamples(true);
            try {
                const result = await getSamples({ pageSize: 100 });
                setSamples(result.data);
            } catch (error) {
                console.error('Failed to load samples:', error);
                // 不显示错误，因为用户可能没有样品权限
            } finally {
                setLoadingSamples(false);
            }
        };
        loadSamples();
    }, []);

    // 选择产品后自动填充
    const handleSelectSample = (sampleId: string | null) => {
        setSelectedSampleId(sampleId);
        if (sampleId) {
            const sample = samples.find(s => s.id === sampleId);
            if (sample) {
                // 样品的 unitCost 和 retailPrice 是以分为单位，需要转换为元
                setInputs(prev => ({
                    ...prev,
                    unitCost: sample.unitCost / 100,
                    unitPrice: sample.retailPrice / 100,
                    sampleCost: sample.unitCost / 100, // 样品成本默认等于单品成本
                }));
                message.success(`已加载产品: ${sample.name}`);
            }
        }
    };

    // 更新输入
    const updateInput = (key: keyof CostInputs, value: number | null) => {
        setInputs(prev => ({
            ...prev,
            [key]: value ?? 0,
        }));
    };

    // 计算结果
    const results = useMemo(() => {
        const {
            sampleCost,
            packagingCost,
            shippingCost,
            pitFee,
            commissionRate,
            platformFeeRate,
            taxRate,
            unitCost,
            unitPrice,
            returnRate,
            hiddenCost,
            expectedSales,
        } = inputs;

        // 固定成本（与销售额无关）
        const fixedCost = sampleCost + packagingCost + shippingCost + pitFee + hiddenCost;

        // 产品成本率 = 单品成本 / 单品售价（自动计算）
        const productCostRate = unitPrice > 0 ? (unitCost / unitPrice) * 100 : 0;

        // 变动成本率（与销售额相关）= 佣金 + 平台扣点 + 税费 + 产品成本
        const variableCostRate = (commissionRate + platformFeeRate + taxRate + productCostRate) / 100;

        // 净销售率（扣除退货后的有效销售比例）
        const netSalesRate = 1 - returnRate / 100;

        // 回本销售额 = 固定成本 / (净销售率 - 变动成本率)
        const profitMarginRate = netSalesRate - variableCostRate;
        const breakEvenSales = profitMarginRate > 0 ? fixedCost / profitMarginRate : Infinity;

        // 基于预期销售额的计算
        const netSales = expectedSales * netSalesRate;
        const productCostTotal = expectedSales * (productCostRate / 100);
        const commissionTotal = expectedSales * (commissionRate / 100);
        const platformFeeTotal = expectedSales * (platformFeeRate / 100);
        const taxTotal = expectedSales * (taxRate / 100);
        const variableCost = productCostTotal + commissionTotal + platformFeeTotal + taxTotal;
        const totalCost = fixedCost + variableCost;
        const profit = netSales - fixedCost - variableCost;
        const roi = totalCost > 0 ? profit / totalCost : 0;

        // 建议批量场景
        const bulkScenarios = [
            { label: '保守', sales: breakEvenSales * 1.2, description: '微利，安全边际' },
            { label: '目标', sales: breakEvenSales * 1.5, description: 'ROI约0.25' },
            { label: '理想', sales: breakEvenSales * 2, description: 'ROI约0.5' },
        ].filter(s => isFinite(s.sales));

        return {
            fixedCost,
            productCostRate,
            variableCostRate,
            netSalesRate,
            breakEvenSales,
            netSales,
            productCostTotal,
            commissionTotal,
            variableCost,
            totalCost,
            profit,
            roi,
            isProfitable: profit > 0,
            profitMarginRate,
            bulkScenarios,
        };
    }, [inputs]);

    // 获取ROI状态颜色和图标
    const getRoiStatus = (roi: number) => {
        if (roi >= 1) return { color: '#52c41a', icon: <RiseOutlined />, text: '高回报' };
        if (roi >= 0.5) return { color: '#1890ff', icon: <RiseOutlined />, text: '良好' };
        if (roi >= 0) return { color: '#faad14', icon: <CheckCircleOutlined />, text: '微利' };
        return { color: '#ff4d4f', icon: <FallOutlined />, text: '亏损' };
    };

    const roiStatus = getRoiStatus(results.roi);

    return (
        <div style={{
            padding: '24px',
            margin: '-24px',
            background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #24243e 100%)',
            minHeight: '100vh',
        }}>
            {/* 页面标题 */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Space>
                        <CalculatorOutlined style={{ fontSize: 28, color: '#fff' }} />
                        <Title level={3} style={{ margin: 0, color: '#fff' }}>ROI 测算工具</Title>
                    </Space>
                    <Paragraph style={{ color: 'rgba(255,255,255,0.65)', marginTop: 8, marginBottom: 0 }}>
                        输入各项成本，快速预估投资回报率，帮助您做出更明智的合作决策
                    </Paragraph>
                </Col>
                <Col>
                    <Space>
                        <Text style={{ color: 'rgba(255,255,255,0.65)' }}>高级选项</Text>
                        <Switch checked={showAdvanced} onChange={setShowAdvanced} />
                    </Space>
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                {/* 左侧：成本输入 */}
                <Col xs={24} lg={12}>
                    <Card
                        title={<span style={{ color: '#fff' }}>💰 成本输入</span>}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 16,
                        }}
                        headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                        bodyStyle={{ padding: '24px' }}
                    >
                        {/* 固定成本 */}
                        <Title level={5} style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>
                            固定成本
                        </Title>

                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <div style={{ marginBottom: 8 }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        样品成本
                                        <Tooltip title="提供给达人用于展示的样品价值">
                                            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                                        </Tooltip>
                                    </Text>
                                </div>
                                <InputNumber
                                    value={inputs.sampleCost}
                                    onChange={v => updateInput('sampleCost', v)}
                                    prefix="¥"
                                    min={0}
                                    precision={2}
                                    style={{ width: '100%' }}
                                    placeholder="0"
                                />
                            </Col>
                            <Col span={12}>
                                <div style={{ marginBottom: 8 }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        坑位费
                                        <Tooltip title="达人收取的固定曝光费用">
                                            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                                        </Tooltip>
                                    </Text>
                                </div>
                                <InputNumber
                                    value={inputs.pitFee}
                                    onChange={v => updateInput('pitFee', v)}
                                    prefix="¥"
                                    min={0}
                                    precision={2}
                                    style={{ width: '100%' }}
                                    placeholder="0"
                                />
                            </Col>
                            <Col span={12}>
                                <div style={{ marginBottom: 8 }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        快递成本
                                        <Tooltip title="寄送样品的运费">
                                            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                                        </Tooltip>
                                    </Text>
                                </div>
                                <InputNumber
                                    value={inputs.shippingCost}
                                    onChange={v => updateInput('shippingCost', v)}
                                    prefix="¥"
                                    min={0}
                                    precision={2}
                                    style={{ width: '100%' }}
                                    placeholder="0"
                                />
                            </Col>
                            <Col span={12}>
                                <div style={{ marginBottom: 8 }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        包装成本
                                        <Tooltip title="样品包装费用">
                                            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                                        </Tooltip>
                                    </Text>
                                </div>
                                <InputNumber
                                    value={inputs.packagingCost}
                                    onChange={v => updateInput('packagingCost', v)}
                                    prefix="¥"
                                    min={0}
                                    precision={2}
                                    style={{ width: '100%' }}
                                    placeholder="0"
                                />
                            </Col>
                        </Row>

                        {showAdvanced && (
                            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                                <Col span={24}>
                                    <div style={{ marginBottom: 8 }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                                            隐形成本
                                            <Tooltip title="其他隐藏成本，如人力时间、沟通成本等">
                                                <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                                            </Tooltip>
                                        </Text>
                                    </div>
                                    <InputNumber
                                        value={inputs.hiddenCost}
                                        onChange={v => updateInput('hiddenCost', v)}
                                        prefix="¥"
                                        min={0}
                                        precision={2}
                                        style={{ width: '100%' }}
                                        placeholder="0"
                                    />
                                </Col>
                            </Row>
                        )}

                        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '24px 0' }} />

                        {/* 产品信息 */}
                        <Title level={5} style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>
                            <ShoppingOutlined style={{ marginRight: 8 }} />
                            产品信息
                        </Title>

                        {/* 产品选择器 */}
                        {samples.length > 0 && (
                            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                <Col span={24}>
                                    <div style={{ marginBottom: 8 }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                                            从样品库选择
                                            <Tooltip title="选择已有产品可自动填充成本和售价">
                                                <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                                            </Tooltip>
                                        </Text>
                                    </div>
                                    <Select
                                        value={selectedSampleId}
                                        onChange={handleSelectSample}
                                        placeholder="选择已有产品（可选）"
                                        allowClear
                                        loading={loadingSamples}
                                        style={{ width: '100%' }}
                                        options={samples.map(s => ({
                                            value: s.id,
                                            label: `${s.name} (${s.sku}) - ¥${(s.retailPrice / 100).toFixed(2)}`,
                                        }))}
                                    />
                                </Col>
                            </Row>
                        )}

                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <div style={{ marginBottom: 8 }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        单品成本
                                        <Tooltip title="生产或采购一个产品的成本">
                                            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                                        </Tooltip>
                                    </Text>
                                </div>
                                <InputNumber
                                    value={inputs.unitCost}
                                    onChange={v => updateInput('unitCost', v)}
                                    prefix="¥"
                                    min={0}
                                    precision={2}
                                    style={{ width: '100%' }}
                                    placeholder="0"
                                />
                            </Col>
                            <Col span={12}>
                                <div style={{ marginBottom: 8 }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        单品售价
                                        <Tooltip title="产品的销售价格">
                                            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                                        </Tooltip>
                                    </Text>
                                </div>
                                <InputNumber
                                    value={inputs.unitPrice}
                                    onChange={v => updateInput('unitPrice', v)}
                                    prefix="¥"
                                    min={0}
                                    precision={2}
                                    style={{ width: '100%' }}
                                    placeholder="0"
                                />
                            </Col>
                            {inputs.unitPrice > 0 && (
                                <Col span={24}>
                                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                                        产品成本率：{results.productCostRate.toFixed(1)}%（自动计算）
                                    </Text>
                                </Col>
                            )}
                        </Row>

                        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '24px 0' }} />

                        {/* 比例参数 */}
                        <Title level={5} style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>
                            交易参数
                        </Title>

                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <div style={{ marginBottom: 8 }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        佣金率
                                        <Tooltip title="达人抽成比例，一般5%-50%">
                                            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                                        </Tooltip>
                                    </Text>
                                </div>
                                <InputNumber
                                    value={inputs.commissionRate}
                                    onChange={v => updateInput('commissionRate', v)}
                                    suffix="%"
                                    min={0}
                                    max={100}
                                    precision={1}
                                    style={{ width: '100%' }}
                                    placeholder="20"
                                />
                            </Col>
                            <Col span={12}>
                                <div style={{ marginBottom: 8 }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        退货率
                                        <Tooltip title="直播电商通常35%-38%，某些品类更高">
                                            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                                        </Tooltip>
                                    </Text>
                                </div>
                                <InputNumber
                                    value={inputs.returnRate}
                                    onChange={v => updateInput('returnRate', v)}
                                    suffix="%"
                                    min={0}
                                    max={100}
                                    precision={1}
                                    style={{ width: '100%' }}
                                    placeholder="30"
                                />
                            </Col>
                            <Col span={12}>
                                <div style={{ marginBottom: 8 }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        平台扣点
                                        <Tooltip title="平台技术服务费，抖音小店约6%，第三方约10%">
                                            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                                        </Tooltip>
                                    </Text>
                                </div>
                                <InputNumber
                                    value={inputs.platformFeeRate}
                                    onChange={v => updateInput('platformFeeRate', v)}
                                    suffix="%"
                                    min={0}
                                    max={100}
                                    precision={1}
                                    style={{ width: '100%' }}
                                    placeholder="6"
                                />
                            </Col>
                            <Col span={12}>
                                <div style={{ marginBottom: 8 }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                                        税费
                                        <Tooltip title="销售产生的税费比例">
                                            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                                        </Tooltip>
                                    </Text>
                                </div>
                                <InputNumber
                                    value={inputs.taxRate}
                                    onChange={v => updateInput('taxRate', v)}
                                    suffix="%"
                                    min={0}
                                    max={100}
                                    precision={1}
                                    style={{ width: '100%' }}
                                    placeholder="0"
                                />
                            </Col>
                        </Row>

                        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '24px 0' }} />

                        {/* 预期销售额 */}
                        <Title level={5} style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>
                            预期销售额（用于计算ROI）
                        </Title>
                        <InputNumber
                            value={inputs.expectedSales}
                            onChange={v => updateInput('expectedSales', v)}
                            prefix="¥"
                            min={0}
                            precision={2}
                            style={{ width: '100%', fontSize: 18 }}
                            placeholder="输入预期GMV"
                        />
                    </Card>
                </Col>

                {/* 右侧：计算结果 */}
                <Col xs={24} lg={12}>
                    {/* 核心指标 */}
                    <Card
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 16,
                            marginBottom: 24,
                        }}
                        bodyStyle={{ padding: '24px' }}
                    >
                        <Row gutter={[24, 24]}>
                            <Col span={12}>
                                <Statistic
                                    title={<span style={{ color: 'rgba(255,255,255,0.65)' }}>📊 回本销售额</span>}
                                    value={isFinite(results.breakEvenSales) ? results.breakEvenSales : '-'}
                                    precision={2}
                                    prefix="¥"
                                    valueStyle={{ color: '#1890ff', fontSize: 28 }}
                                />
                                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                                    达到此销售额即可覆盖所有成本
                                </Text>
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title={<span style={{ color: 'rgba(255,255,255,0.65)' }}>💵 固定成本合计</span>}
                                    value={results.fixedCost}
                                    precision={2}
                                    prefix="¥"
                                    valueStyle={{ color: '#faad14', fontSize: 28 }}
                                />
                                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                                    样品+包装+快递+坑位费
                                </Text>
                            </Col>
                        </Row>
                    </Card>

                    {/* ROI 结果 */}
                    {inputs.expectedSales > 0 && (
                        <Card
                            style={{
                                background: results.isProfitable
                                    ? 'linear-gradient(135deg, rgba(82,196,26,0.2) 0%, rgba(82,196,26,0.05) 100%)'
                                    : 'linear-gradient(135deg, rgba(255,77,79,0.2) 0%, rgba(255,77,79,0.05) 100%)',
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${results.isProfitable ? 'rgba(82,196,26,0.3)' : 'rgba(255,77,79,0.3)'}`,
                                borderRadius: 16,
                                marginBottom: 24,
                            }}
                            bodyStyle={{ padding: '24px' }}
                        >
                            <Row gutter={[24, 24]} align="middle">
                                <Col span={12}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 48, fontWeight: 700, color: roiStatus.color }}>
                                            {roiStatus.icon} {(results.roi * 100).toFixed(1)}%
                                        </div>
                                        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16 }}>
                                            投资回报率 (ROI)
                                        </Text>
                                        <div style={{ marginTop: 8 }}>
                                            <Text style={{
                                                color: roiStatus.color,
                                                fontSize: 14,
                                                padding: '4px 12px',
                                                background: `${roiStatus.color}20`,
                                                borderRadius: 12,
                                            }}>
                                                {roiStatus.text}
                                            </Text>
                                        </div>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <Row gutter={[0, 16]}>
                                        <Col span={24}>
                                            <Statistic
                                                title={<span style={{ color: 'rgba(255,255,255,0.65)' }}>净利润</span>}
                                                value={results.profit}
                                                precision={2}
                                                prefix={results.profit >= 0 ? '+¥' : '¥'}
                                                valueStyle={{ color: results.profit >= 0 ? '#52c41a' : '#ff4d4f' }}
                                            />
                                        </Col>
                                        <Col span={24}>
                                            <Statistic
                                                title={<span style={{ color: 'rgba(255,255,255,0.65)' }}>净销售额</span>}
                                                value={results.netSales}
                                                precision={2}
                                                prefix="¥"
                                                valueStyle={{ color: 'rgba(255,255,255,0.85)' }}
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </Card>
                    )}

                    {/* 成本明细 */}
                    {inputs.expectedSales > 0 && (
                        <Card
                            title={<span style={{ color: '#fff' }}>📋 成本明细</span>}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 16,
                                marginBottom: 24,
                            }}
                            headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                            bodyStyle={{ padding: '24px' }}
                        >
                            <Row gutter={[16, 12]}>
                                <Col span={16}><Text style={{ color: 'rgba(255,255,255,0.65)' }}>固定成本</Text></Col>
                                <Col span={8} style={{ textAlign: 'right' }}><Text style={{ color: '#fff' }}>¥{results.fixedCost.toFixed(2)}</Text></Col>

                                <Col span={16}><Text style={{ color: 'rgba(255,255,255,0.65)' }}>佣金支出（{inputs.commissionRate}%）</Text></Col>
                                <Col span={8} style={{ textAlign: 'right' }}><Text style={{ color: '#fff' }}>¥{(inputs.expectedSales * inputs.commissionRate / 100).toFixed(2)}</Text></Col>

                                <Col span={16}><Text style={{ color: 'rgba(255,255,255,0.65)' }}>平台扣点（{inputs.platformFeeRate}%）</Text></Col>
                                <Col span={8} style={{ textAlign: 'right' }}><Text style={{ color: '#fff' }}>¥{(inputs.expectedSales * inputs.platformFeeRate / 100).toFixed(2)}</Text></Col>

                                {inputs.taxRate > 0 && (
                                    <>
                                        <Col span={16}><Text style={{ color: 'rgba(255,255,255,0.65)' }}>税费（{inputs.taxRate}%）</Text></Col>
                                        <Col span={8} style={{ textAlign: 'right' }}><Text style={{ color: '#fff' }}>¥{(inputs.expectedSales * inputs.taxRate / 100).toFixed(2)}</Text></Col>
                                    </>
                                )}

                                <Col span={16}><Text style={{ color: 'rgba(255,255,255,0.65)' }}>产品成本（{results.productCostRate.toFixed(1)}%）</Text></Col>
                                <Col span={8} style={{ textAlign: 'right' }}><Text style={{ color: '#fff' }}>¥{results.productCostTotal.toFixed(2)}</Text></Col>

                                <Col span={16}><Text style={{ color: 'rgba(255,255,255,0.65)' }}>退货损失（{inputs.returnRate}%）</Text></Col>
                                <Col span={8} style={{ textAlign: 'right' }}><Text style={{ color: '#ff4d4f' }}>-¥{(inputs.expectedSales * inputs.returnRate / 100).toFixed(2)}</Text></Col>

                                <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

                                <Col span={16}><Text strong style={{ color: '#fff' }}>总成本</Text></Col>
                                <Col span={8} style={{ textAlign: 'right' }}><Text strong style={{ color: '#faad14' }}>¥{results.totalCost.toFixed(2)}</Text></Col>
                            </Row>
                        </Card>
                    )}

                    {/* 提示信息 */}
                    {results.profitMarginRate <= 0 && (
                        <Alert
                            message="成本结构警告"
                            description="当前佣金率+产品成本率+退货率超过100%，无论销售额多少都无法盈利。建议降低成本比例或提高售价。"
                            type="error"
                            showIcon
                            icon={<WarningOutlined />}
                            style={{ marginBottom: 24 }}
                        />
                    )}

                    {/* 建议场景 */}
                    {results.bulkScenarios.length > 0 && results.fixedCost > 0 && (
                        <Card
                            title={<span style={{ color: '#fff' }}>🎯 销售目标建议</span>}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 16,
                            }}
                            headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                            bodyStyle={{ padding: '24px' }}
                        >
                            <Row gutter={[16, 16]}>
                                {results.bulkScenarios.map((scenario, index) => (
                                    <Col span={8} key={index}>
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '16px',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: 12,
                                        }}>
                                            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{scenario.label}</Text>
                                            <div style={{ fontSize: 20, fontWeight: 600, color: '#1890ff', margin: '8px 0' }}>
                                                ¥{scenario.sales.toFixed(0)}
                                            </div>
                                            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{scenario.description}</Text>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    )}
                </Col>
            </Row>
        </div>
    );
};

export default RoiCalculatorPage;
