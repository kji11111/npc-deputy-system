import { useEffect, useMemo, useState } from 'react';
import {
  App as AntApp, AutoComplete, Avatar, Button, Card, Col, DatePicker, Descriptions, Drawer, Form, Input,
  InputNumber, Modal, Popconfirm, Row, Select, Space, Switch, Table, Tabs, Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { EChartsOption } from 'echarts';
import type { Activity, Deputy, Proposal } from '../types';
import { useStore } from '../store/AppStore';
import { computePerformance, RADAR_DIMS } from '../utils/performance';
import { downloadCSV } from '../utils/csv';
import EChart from '../components/EChart';

/** 表单值类型（日期为 Dayjs，提交时转字符串；界别/镇街为可搜索+可输入新值） */
interface DeputyFormValues {
  name: string;
  gender: Deputy['gender'];
  birthYear: number;
  political: string;
  sector: string;
  town: string;
  level: string;
  termStart: number;
  consecutive: boolean;
  occupation: string;
  phone: string;
  email: string;
  address: string;
  joinDate: Dayjs;
  bio: string;
  contactVoters: number;
}

/** 生成下一个档案编号 DBxxxx */
function nextDeputyId(list: Deputy[]): string {
  let max = 0;
  list.forEach((d) => {
    const m = d.id.match(/^DB(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return 'DB' + String(max + 1).padStart(4, '0');
}

/** 代表档案管理：页头醒目新增入口 + 列表（搜索/筛选/分页/CSV/删除）+ 详情抽屉（履职画像）+ 新增/编辑 */
export default function Deputies() {
  const { user, deputies, activities, proposals, saveDeputy, removeDeputy } = useStore();
  const { message } = AntApp.useApp();
  const isAdmin = user?.role === 'admin';

  const [kw, setKw] = useState('');
  const [sector, setSector] = useState<string | undefined>();
  const [town, setTown] = useState<string | undefined>();
  const [reElect, setReElect] = useState<string | undefined>();
  const [detailId, setDetailId] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Deputy | null>(null);
  const [form] = Form.useForm<DeputyFormValues>();

  /** 代表角色：进入页面自动打开本人档案抽屉，列表只保留本人 */
  useEffect(() => {
    if (user?.role === 'deputy' && user.deputyId) setDetailId(user.deputyId);
  }, [user]);

  const base = isAdmin ? deputies : deputies.filter((d) => d.id === user?.deputyId);

  const list = useMemo(
    () =>
      base.filter(
        (d) =>
          (!kw || d.name.includes(kw) || d.id.includes(kw)) &&
          (!sector || d.sector === sector) &&
          (!town || d.town === town) &&
          (!reElect || (reElect === '连任') === d.consecutive),
      ),
    [base, kw, sector, town, reElect],
  );

  /** 履职积分映射（表格排序与 CSV 导出共用） */
  const scores = useMemo(() => {
    const map = new Map<string, number>();
    deputies.forEach((d) => map.set(d.id, computePerformance(d, activities, proposals).score));
    return map;
  }, [deputies, activities, proposals]);

  const sectorOpts = useMemo(() => [...new Set(deputies.map((d) => d.sector))], [deputies]);
  const townOpts = useMemo(() => [...new Set(deputies.map((d) => d.town))], [deputies]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      gender: '男',
      consecutive: false,
      birthYear: 1985,
      political: '中共党员',
      contactVoters: 15,
      joinDate: dayjs(),
      termStart: 2024,
      level: '镇第七届人大代表',
    });
    setModalOpen(true);
  };

  const openEdit = (d: Deputy) => {
    setEditing(d);
    form.setFieldsValue({
      name: d.name, gender: d.gender, birthYear: d.birthYear, political: d.political, sector: d.sector,
      town: d.town, level: d.level, termStart: d.termStart, consecutive: d.consecutive,
      occupation: d.occupation, phone: d.phone, email: d.email, address: d.address,
      joinDate: dayjs(d.joinDate), bio: d.bio, contactVoters: d.contactVoters,
    });
    setModalOpen(true);
  };

  const submit = (v: DeputyFormValues) => {
    const id = editing ? editing.id : nextDeputyId(deputies);
    saveDeputy({ ...v, id, joinDate: v.joinDate.format('YYYY-MM-DD') });
    // 登录页“人大代表”下拉来自 store（非写死 mock），新增代表后立即出现在下拉中
    message.success(editing ? '档案已更新' : '档案已新增，退出后可在登录页用该代表身份进入');
    setModalOpen(false);
  };

  const exportCSV = () => {
    downloadCSV(
      '代表档案_' + dayjs().format('YYYYMMDD') + '.csv',
      ['编号', '姓名', '性别', '出生年份', '政治面貌', '界别', '镇街', '层级', '任期起始', '连任情况', '职业单位', '联系电话', '电子邮箱', '当选日期', '联系群众(次)', '履职积分'],
      list.map((d) => [
        d.id, d.name, d.gender, d.birthYear, d.political, d.sector, d.town, d.level, d.termStart,
        d.consecutive ? '连任' : '新任', d.occupation, d.phone, d.email, d.joinDate, d.contactVoters,
        scores.get(d.id) ?? 0,
      ]),
    );
    message.success('已导出 CSV（' + list.length + ' 条）');
  };

  const columns: ColumnsType<Deputy> = [
    { title: '编号', dataIndex: 'id', width: 92 },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 150,
      render: (_, d) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: d.gender === '女' ? '#c2715d' : '#11685f' }}>
            {d.name.charAt(0)}
          </Avatar>
          <span>{d.name}</span>
        </Space>
      ),
    },
    { title: '性别', dataIndex: 'gender', width: 70 },
    { title: '界别', dataIndex: 'sector', width: 110 },
    { title: '镇街', dataIndex: 'town', width: 100 },
    { title: '政治面貌', dataIndex: 'political', width: 100 },
    {
      title: '任期',
      key: 'term',
      width: 140,
      render: (_, d) => (
        <Space size={4}>
          <Tag color={d.consecutive ? 'green' : 'blue'}>{d.consecutive ? '连任' : '新任'}</Tag>
          <span className="tabular-nums">{d.termStart} 年起</span>
        </Space>
      ),
    },
    {
      title: '履职积分',
      key: 'score',
      width: 100,
      sorter: (a, b) => (scores.get(a.id) ?? 0) - (scores.get(b.id) ?? 0),
      render: (_, d) => <span className="tabular-nums">{scores.get(d.id) ?? 0}</span>,
    },
    {
      title: '操作',
      key: 'op',
      width: 180,
      fixed: 'right',
      render: (_, d) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => setDetailId(d.id)}>详情</Button>
          {isAdmin && <Button type="link" size="small" onClick={() => openEdit(d)}>编辑</Button>}
          {isAdmin && (
            <Popconfirm
              title="确认删除该代表档案？"
              description="仅从档案列表移除（演示数据可重置）；其历史活动与建议记录保留。"
              okText="删除"
              cancelText="取消"
              onConfirm={() => {
                removeDeputy(d.id);
                message.success('档案已删除');
              }}
            >
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];
  const detail = detailId ? deputies.find((d) => d.id === detailId) : undefined;

  return (
    <div>
      {/* 页面标题区域：更显眼的新增主按钮（管理员可见） */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 17, fontWeight: 600 }}>代表档案管理</span>
        {isAdmin && (
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openAdd}>
            新增代表档案
          </Button>
        )}
      </div>
      <Card size="small">
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search allowClear placeholder="搜索姓名 / 编号" style={{ width: 220 }} value={kw} onChange={(e) => setKw(e.target.value)} />
          <Select allowClear placeholder="界别" style={{ width: 130 }} value={sector} onChange={setSector} options={sectorOpts.map((s) => ({ value: s, label: s }))} />
          <Select allowClear placeholder="镇街" style={{ width: 130 }} value={town} onChange={setTown} options={townOpts.map((s) => ({ value: s, label: s }))} />
          <Select allowClear placeholder="连任情况" style={{ width: 120 }} value={reElect} onChange={setReElect} options={[{ value: '连任', label: '连任' }, { value: '新任', label: '新任' }]} />
          {isAdmin && <Button icon={<PlusOutlined />} type="primary" onClick={openAdd}>新增代表</Button>}
          {isAdmin && <Button icon={<DownloadOutlined />} onClick={exportCSV}>导出 CSV</Button>}
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={list}
          size="middle"
          scroll={{ x: 1050 }}
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => '共 ' + t + ' 名代表' }}
        />
      </Card>

      <DeputyDrawer deputy={detail} onClose={() => setDetailId(undefined)} />

      <Modal
        open={modalOpen}
        title={editing ? '编辑代表档案 · ' + editing.id : '新增代表档案'}
        width={720}
        okText="保存"
        cancelText="取消"
        onOk={() => form.submit()}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}><Select options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]} /></Form.Item></Col>
            <Col span={8}><Form.Item name="birthYear" label="出生年份" rules={[{ required: true, message: '请填写出生年份' }]}><InputNumber min={1930} max={2010} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="political" label="政治面貌" rules={[{ required: true, message: '请选择' }]}><Select options={['中共党员', '群众', '民主党派'].map((s) => ({ value: s, label: s }))} /></Form.Item></Col>
            {/* 界别：可搜索、允许输入新值（AutoComplete） */}
            <Col span={8}>
              <Form.Item name="sector" label="界别" rules={[{ required: true, message: '请选择或输入界别' }]}>
                <AutoComplete
                  options={sectorOpts.map((s) => ({ value: s }))}
                  filterOption={(input, option) => String(option?.value ?? '').includes(input)}
                  placeholder="搜索或输入新界别"
                />
              </Form.Item>
            </Col>
            {/* 所属镇街：可搜索、允许输入新值（AutoComplete） */}
            <Col span={8}>
              <Form.Item name="town" label="所属镇街" rules={[{ required: true, message: '请选择或输入镇街' }]}>
                <AutoComplete
                  options={townOpts.map((s) => ({ value: s }))}
                  filterOption={(input, option) => String(option?.value ?? '').includes(input)}
                  placeholder="搜索或输入新镇街"
                />
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="level" label="层级" rules={[{ required: true, message: '请填写层级' }]}><Input placeholder="如：镇第七届人大代表" /></Form.Item></Col>
            <Col span={8}><Form.Item name="termStart" label="本届起始年" rules={[{ required: true, message: '请填写年份' }]}><InputNumber min={2015} max={2030} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="consecutive" label="连任情况" valuePropName="checked"><Switch checkedChildren="连任" unCheckedChildren="新任" /></Form.Item></Col>
            <Col span={16}><Form.Item name="occupation" label="职业及单位" rules={[{ required: true, message: '请填写职业及单位' }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="joinDate" label="当选日期" rules={[{ required: true, message: '请选择日期' }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="phone" label="联系电话"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="email" label="电子邮箱"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="contactVoters" label="联系群众（次/年）"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={24}><Form.Item name="address" label="联系地址"><Input /></Form.Item></Col>
            <Col span={24}><Form.Item name="bio" label="个人简介"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

/** 代表详情抽屉：基本信息 + 履职画像雷达图 + 参加活动/提出建议两个标签页 */
function DeputyDrawer({ deputy, onClose }: { deputy: Deputy | undefined; onClose: () => void }) {
  const { activities, proposals } = useStore();

  const perf = useMemo(() => (deputy ? computePerformance(deputy, activities, proposals) : null), [deputy, activities, proposals]);
  const myActivities = useMemo(
    () => (deputy ? activities.filter((a) => a.participantIds.includes(deputy.id)).sort((a, b) => b.date.localeCompare(a.date)) : []),
    [deputy, activities],
  );
  const myProposals = useMemo(
    () => (deputy ? proposals.filter((p) => p.proposerId === deputy.id || p.cosponsorIds.includes(deputy.id)).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)) : []),
    [deputy, proposals],
  );

  const radarOption: EChartsOption | null = perf
    ? {
        color: ['#11685f'],
        radar: {
          indicator: RADAR_DIMS.map((name) => ({ name, max: 100 })),
          radius: '62%',
          splitNumber: 4,
          axisName: { color: '#637674' },
          splitArea: { areaStyle: { color: ['#f3f6f5', '#eaf2ef'] } },
        },
        series: [{ type: 'radar', areaStyle: { opacity: 0.25 }, data: [{ value: perf.radar, name: '履职画像' }] }],
      }
    : null;

  const actCols: ColumnsType<Activity> = [
    { title: '日期', dataIndex: 'date', width: 105 },
    { title: '类型', dataIndex: 'type', width: 90 },
    { title: '主题', dataIndex: 'title' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 84,
      render: (s: string) => <Tag color={s === '已完成' ? 'green' : s === '计划中' ? 'blue' : 'default'}>{s}</Tag>,
    },
  ];

  const prpCols: ColumnsType<Proposal> = [
    { title: '编号', dataIndex: 'id', width: 110 },
    { title: '标题', dataIndex: 'title' },
    { title: '分类', dataIndex: 'category', width: 90 },
    {
      title: '角色',
      key: 'role',
      width: 74,
      render: (_, p) => <Tag color={p.proposerId === deputy?.id ? 'green' : 'blue'}>{p.proposerId === deputy?.id ? '领衔' : '附议'}</Tag>,
    },
    { title: '状态', dataIndex: 'status', width: 84 },
  ];

  return (
    <Drawer
      open={!!deputy}
      onClose={onClose}
      width={720}
      title={deputy ? deputy.name + ' · ' + deputy.id : ''}
      afterOpenChange={(open) => {
        if (open) window.dispatchEvent(new Event('resize'));
      }}
    >
      {deputy && perf && radarOption && (
        <>
          <Descriptions
            bordered
            size="small"
            column={2}
            items={[
              { key: 'gender', label: '性别', children: deputy.gender },
              { key: 'birth', label: '出生年份', children: deputy.birthYear },
              { key: 'political', label: '政治面貌', children: deputy.political },
              { key: 'sector', label: '界别', children: deputy.sector },
              { key: 'town', label: '所属镇街', children: deputy.town },
              { key: 'level', label: '层级', children: deputy.level },
              { key: 'occupation', label: '职业单位', children: deputy.occupation, span: 2 },
              { key: 'phone', label: '联系电话', children: deputy.phone },
              { key: 'email', label: '电子邮箱', children: deputy.email },
              { key: 'join', label: '当选日期', children: deputy.joinDate },
              { key: 'contact', label: '联系群众', children: deputy.contactVoters + ' 次' },
              { key: 'address', label: '联系地址', children: deputy.address, span: 2 },
              { key: 'bio', label: '个人简介', children: deputy.bio, span: 2 },
            ]}
          />
          <div className="drawer-section-title">履职画像（积分 {perf.score}）</div>
          <Row gutter={16}>
            <Col span={14}>
              <EChart option={radarOption} height={260} />
            </Col>
            <Col span={10}>
              <div style={{ fontSize: 13, color: '#637674', lineHeight: 2, paddingTop: 20 }}>
                <div>参加活动 {perf.activityCount} 场</div>
                <div>提出/附议建议 {perf.proposalCount} 件</div>
                <div>联系群众 {deputy.contactVoters} 次</div>
                <div style={{ marginTop: 8 }}>积分 = 活动×2 + 建议×3</div>
                <div>+ 培训 + 述职×5 + 联系群众×0.2</div>
              </div>
            </Col>
          </Row>
          <Tabs
            size="small"
            items={[
              { key: 'act', label: '参加活动（' + myActivities.length + '）', children: <Table size="small" rowKey="id" pagination={false} dataSource={myActivities} columns={actCols} /> },
              { key: 'prp', label: '提出建议（' + myProposals.length + '）', children: <Table size="small" rowKey="id" pagination={false} dataSource={myProposals} columns={prpCols} /> },
            ]}
          />
        </>
      )}
    </Drawer>
  );
}