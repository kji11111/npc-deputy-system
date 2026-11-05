import { useMemo } from 'react';
import { Alert, Card, Col, Row } from 'antd';
import dayjs from 'dayjs';
import type { BarSeriesOption, EChartsOption, PieSeriesOption } from 'echarts';
import type { ActivityType, ProposalCategory, ProposalStatus } from '../types';
import { useStore } from '../store/AppStore';
import { computePerformance } from '../utils/performance';
import EChart from '../components/EChart';
import StatCard from '../components/StatCard';

const ACT_TYPES: ActivityType[] = ['调研视察', '约见镇长', '代表述职', '学习培训'];
const STATUS_LIST: ProposalStatus[] = ['待审核', '已交办', '办理中', '已答复', '已评价', '已退回'];
const STATUS_COLORS: Record<ProposalStatus, string> = {
  待审核: '#d6a044',
  已交办: '#5b8ff9',
  办理中: '#11685f',
  已答复: '#4ba39a',
  已评价: '#3f8f5f',
  已退回: '#c95656',
};

/** 数据仪表盘：统计卡（仿模板 .cut）+ 四张 ECharts 图表（仅管理员可见） */
export default function Dashboard() {
  const { deputies, activities, proposals } = useStore();

  /** 统计卡数据 */
  const stats = useMemo(() => {
    const yearAgo = dayjs().subtract(1, 'year');
    const actCount = activities.filter((a) => dayjs(a.date).isAfter(yearAgo)).length;
    const done = proposals.filter((p) => p.status === '已评价').length;
    const rate = proposals.length ? Math.round((done / proposals.length) * 100) : 0;
    return { deputies: deputies.length, actCount, proposals: proposals.length, done, rate };
  }, [deputies, activities, proposals]);

  /** 图1：近 6 个月活动数量（按类型堆叠） */
  const activityOption = useMemo<EChartsOption>(() => {
    const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month'));
    const series: BarSeriesOption[] = ACT_TYPES.map((t) => ({
      name: t,
      type: 'bar',
      stack: 'total',
      barMaxWidth: 26,
      data: months.map((m) => activities.filter((a) => a.type === t && dayjs(a.date).isSame(m, 'month')).length),
    }));
    return {
      color: ['#11685f', '#d6a044', '#4ba39a', '#8fb8b3'],
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      grid: { left: 40, right: 16, top: 20, bottom: 56 },
      xAxis: { type: 'category', data: months.map((m) => m.format('M月')) },
      yAxis: { type: 'value', minInterval: 1 },
      series,
    };
  }, [activities]);

  /** 图2：提案分类分布（环形图） */
  const categoryOption = useMemo<EChartsOption>(() => {
    const cats: ProposalCategory[] = ['城乡建设', '交通出行', '民生保障', '教育医疗', '生态环境', '乡村振兴', '其他'];
    const data = cats
      .map((c) => ({ name: c, value: proposals.filter((p) => p.category === c).length }))
      .filter((x) => x.value > 0);
    const series: PieSeriesOption[] = [
      {
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '44%'],
        itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 6 },
        label: { formatter: '{b} {c}件' },
        data,
      },
    ];
    return {
      color: ['#11685f', '#4ba39a', '#d6a044', '#c2715d', '#8fb8b3', '#7a9e57', '#a58fb8'],
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series,
    };
  }, [proposals]);

  /** 图3：办理状态分布（对齐参考模板琥珀/青绿配色的状态色） */
  const statusOption = useMemo<EChartsOption>(() => {
    const series: BarSeriesOption[] = [
      {
        type: 'bar',
        barWidth: 20,
        data: STATUS_LIST.map((s) => ({
          value: proposals.filter((p) => p.status === s).length,
          itemStyle: { color: STATUS_COLORS[s] },
        })),
        label: { show: true, position: 'right' },
      },
    ];
    return {
      tooltip: {},
      grid: { left: 70, right: 40, top: 12, bottom: 28 },
      xAxis: { type: 'value', minInterval: 1 },
      yAxis: { type: 'category', data: STATUS_LIST },
      series,
    };
  }, [proposals]);

  /** 图4：履职积分 Top8 */
  const topOption = useMemo<EChartsOption>(() => {
    const ranked = deputies
      .map((d) => ({ name: d.name, score: computePerformance(d, activities, proposals).score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .reverse();
    const series: BarSeriesOption[] = [
      {
        type: 'bar',
        barWidth: 16,
        data: ranked.map((r) => r.score),
        itemStyle: { color: '#11685f' },
        label: { show: true, position: 'right' },
      },
    ];
    return {
      tooltip: {},
      grid: { left: 70, right: 40, top: 12, bottom: 28 },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: ranked.map((r) => r.name) },
      series,
    };
  }, [deputies, activities, proposals]);

  return (
    <div>
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="演示数据说明"
        description="本页统计基于固定种子 mock 数据（首访后保存在本机浏览器），不代表真实业务数据；可在顶栏“重置演示数据”恢复初始状态。"
      />
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <StatCard label="代表总数（名）" value={stats.deputies} sub="含本届新任与连任代表" />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard label="近一年活动（场）" value={stats.actCount} sub="调研视察 / 约见镇长 / 代表述职 / 培训" />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard label="提案建议（件）" value={stats.proposals} sub={'已办结 ' + stats.done + ' 件'} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard label="办结率" value={stats.rate + '%'} sub="已评价（满意/基本满意）占比" />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="近 6 个月活动数量（按类型）" size="small">
            <EChart option={activityOption} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="提案建议分类分布" size="small">
            <EChart option={categoryOption} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="提案办理状态分布" size="small">
            <EChart option={statusOption} height={280} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="代表履职积分 Top8" size="small">
            <EChart option={topOption} height={280} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}