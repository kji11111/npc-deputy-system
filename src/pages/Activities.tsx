import { useMemo, useState } from 'react';
import {
  App as AntApp, Button, Card, DatePicker, Descriptions, Drawer, Form, Input, Modal,
  Popconfirm, Select, Space, Table, Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { Activity, ActivityStatus, ActivityType, Deputy } from '../types';
import { useStore } from '../store/AppStore';
import { downloadCSV } from '../utils/csv';

/** 活动类型配色（对齐参考模板色系） */
const TYPE_COLORS: Record<ActivityType, string> = { 调研视察: 'geekblue', 约见镇长: 'gold', 代表述职: 'purple', 学习培训: 'cyan' };
const STATUS_COLORS: Record<ActivityStatus, string> = { 计划中: 'blue', 已完成: 'green', 已取消: 'default' };

interface ActivityFormValues {
  type: ActivityType;
  title: string;
  date: Dayjs;
  location: string;
  organizer: string;
  status: ActivityStatus;
  participantIds: string[];
  summary: string;
}

/** 生成下一个活动编号 HDyyyy-xxx */
function nextActivityId(list: Activity[]): string {
  const y = dayjs().year();
  let max = 0;
  list.forEach((a) => {
    const m = a.id.match(new RegExp('^HD' + y + '-(\\d+)$'));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return 'HD' + y + '-' + String(max + 1).padStart(3, '0');
}

/** 活动管理：调研视察/约见镇长/代表述职/学习培训 的组织与记录（管理员 CRUD，代表只读本人参加） */
export default function Activities() {
  const { user, activities, deputies, saveActivity, removeActivity } = useStore();
  const { message } = AntApp.useApp();
  const isAdmin = user?.role === 'admin';

  const [kw, setKw] = useState('');
  const [type, setType] = useState<ActivityType | undefined>();
  const [status, setStatus] = useState<ActivityStatus | undefined>();
  const [year, setYear] = useState<string | undefined>();
  const [detailId, setDetailId] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form] = Form.useForm<ActivityFormValues>();

  /** 代表角色只看自己参加的活动 */
  const base = isAdmin ? activities : activities.filter((a) => a.participantIds.includes(user?.deputyId ?? ''));

  const yearOpts = useMemo(() => [...new Set(activities.map((a) => a.date.slice(0, 4)))].sort().reverse(), [activities]);

  const list = useMemo(
    () =>
      base.filter(
        (a) =>
          (!kw || a.title.includes(kw) || a.id.includes(kw) || a.location.includes(kw)) &&
          (!type || a.type === type) &&
          (!status || a.status === status) &&
          (!year || a.date.startsWith(year)),
      ),
    [base, kw, type, status, year],
  );

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ type: '调研视察', status: '计划中', date: dayjs(), organizer: '镇人大主席团', participantIds: [] });
    setModalOpen(true);
  };

  const openEdit = (a: Activity) => {
    setEditing(a);
    form.setFieldsValue({
      type: a.type, title: a.title, date: dayjs(a.date), location: a.location,
      organizer: a.organizer, status: a.status, participantIds: a.participantIds, summary: a.summary,
    });
    setModalOpen(true);
  };

  const submit = (v: ActivityFormValues) => {
    const id = editing ? editing.id : nextActivityId(activities);
    saveActivity({
      id,
      type: v.type,
      title: v.title,
      date: v.date.format('YYYY-MM-DD'),
      location: v.location,
      organizer: v.organizer,
      status: v.status,
      participantIds: v.participantIds,
      summary: v.summary,
      createdAt: editing?.createdAt ?? dayjs().format('YYYY-MM-DD HH:mm'),
    });
    message.success(editing ? '活动已更新' : '活动已登记');
    setModalOpen(false);
  };

  const exportCSV = () => {
    downloadCSV(
      '履职活动_' + dayjs().format('YYYYMMDD') + '.csv',
      ['编号', '类型', '主题', '日期', '地点', '组织单位', '状态', '参加人数', '活动纪要'],
      list.map((a) => [a.id, a.type, a.title, a.date, a.location, a.organizer, a.status, a.participantIds.length, a.summary]),
    );
    message.success('已导出 CSV（' + list.length + ' 条）');
  };

  const columns: ColumnsType<Activity> = [
    { title: '编号', dataIndex: 'id', width: 120 },
    { title: '类型', dataIndex: 'type', width: 100, render: (t: ActivityType) => <Tag color={TYPE_COLORS[t]}>{t}</Tag> },
    { title: '主题', dataIndex: 'title', ellipsis: true },
    { title: '日期', dataIndex: 'date', width: 110, sorter: (a, b) => a.date.localeCompare(b.date), defaultSortOrder: 'descend' },
    { title: '地点', dataIndex: 'location', width: 160, ellipsis: true },
    { title: '组织单位', dataIndex: 'organizer', width: 150, ellipsis: true },
    { title: '参加人数', key: 'count', width: 90, align: 'right', render: (_, a) => <span className="tabular-nums">{a.participantIds.length}</span> },
    { title: '状态', dataIndex: 'status', width: 88, render: (s: ActivityStatus) => <Tag color={STATUS_COLORS[s]}>{s}</Tag> },
    {
      title: '操作',
      key: 'op',
      width: 150,
      fixed: 'right',
      render: (_, a) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => setDetailId(a.id)}>详情</Button>
          {isAdmin && <Button type="link" size="small" onClick={() => openEdit(a)}>编辑</Button>}
          {isAdmin && (
            <Popconfirm
              title="确认删除该活动？"
              description="删除后不可恢复（演示数据可重置）。"
              okText="删除"
              cancelText="取消"
              onConfirm={() => {
                removeActivity(a.id);
                message.success('活动已删除');
              }}
            >
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card size="small">
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search allowClear placeholder="搜索主题 / 编号 / 地点" style={{ width: 230 }} value={kw} onChange={(e) => setKw(e.target.value)} />
          <Select allowClear placeholder="活动类型" style={{ width: 130 }} value={type} onChange={setType} options={(Object.keys(TYPE_COLORS) as ActivityType[]).map((t) => ({ value: t, label: t }))} />
          <Select allowClear placeholder="状态" style={{ width: 110 }} value={status} onChange={setStatus} options={(Object.keys(STATUS_COLORS) as ActivityStatus[]).map((s) => ({ value: s, label: s }))} />
          <Select allowClear placeholder="年份" style={{ width: 100 }} value={year} onChange={setYear} options={yearOpts.map((y) => ({ value: y, label: y }))} />
          {isAdmin && <Button icon={<PlusOutlined />} type="primary" onClick={openAdd}>新建活动</Button>}
          {isAdmin && <Button icon={<DownloadOutlined />} onClick={exportCSV}>导出 CSV</Button>}
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={list}
          size="middle"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => '共 ' + t + ' 场活动' }}
        />
      </Card>

      <ActivityDrawer activityId={detailId} onClose={() => setDetailId(undefined)} />

      <Modal
        open={modalOpen}
        title={editing ? '编辑活动 · ' + editing.id : '新建履职活动'}
        width={680}
        okText="保存"
        cancelText="取消"
        onOk={() => form.submit()}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Space direction="vertical" style={{ width: '100%' }} size={0}>
            <Space wrap size={16}>
              <Form.Item name="type" label="活动类型" rules={[{ required: true, message: '请选择类型' }]} style={{ minWidth: 160 }}>
                <Select options={(Object.keys(TYPE_COLORS) as ActivityType[]).map((t) => ({ value: t, label: t }))} />
              </Form.Item>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]} style={{ minWidth: 120 }}>
                <Select options={(Object.keys(STATUS_COLORS) as ActivityStatus[]).map((s) => ({ value: s, label: s }))} />
              </Form.Item>
              <Form.Item name="date" label="活动日期" rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker style={{ width: 150 }} />
              </Form.Item>
            </Space>
            <Form.Item name="title" label="活动主题" rules={[{ required: true, message: '请输入主题' }]}>
              <Input placeholder="如：农村人居环境整治情况视察" />
            </Form.Item>
            <Space wrap size={16}>
              <Form.Item name="location" label="地点" rules={[{ required: true, message: '请输入地点' }]} style={{ minWidth: 220 }}>
                <Input />
              </Form.Item>
              <Form.Item name="organizer" label="组织单位" rules={[{ required: true, message: '请输入组织单位' }]} style={{ minWidth: 220 }}>
                <Input />
              </Form.Item>
            </Space>
            <Form.Item name="participantIds" label="参加代表" rules={[{ required: true, message: '请选择至少一名代表' }]}>
              <Select
                mode="multiple"
                showSearch
                optionFilterProp="label"
                placeholder="选择参加代表（可多选）"
                options={deputies.map((d) => ({ value: d.id, label: d.name + '（' + d.town + '）' }))}
              />
            </Form.Item>
            <Form.Item name="summary" label="活动纪要">
              <Input.TextArea rows={4} placeholder="记录活动开展情况、发现的问题与处理意见等" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}

/** 活动详情抽屉：基本信息 + 参加代表 + 活动纪要 */
function ActivityDrawer({ activityId, onClose }: { activityId: string | undefined; onClose: () => void }) {
  const { activities, deputies } = useStore();
  const activity = activityId ? activities.find((a) => a.id === activityId) : undefined;
  const parts: Deputy[] = (activity?.participantIds ?? [])
    .map((pid) => deputies.find((d) => d.id === pid))
    .filter((d): d is Deputy => !!d);

  return (
    <Drawer open={!!activity} onClose={onClose} width={640} title={activity ? activity.id + ' · ' + activity.title : ''}>
      {activity && (
        <>
          <Descriptions
            bordered
            size="small"
            column={2}
            items={[
              { key: 'type', label: '活动类型', children: <Tag color={TYPE_COLORS[activity.type]}>{activity.type}</Tag> },
              { key: 'status', label: '状态', children: <Tag color={STATUS_COLORS[activity.status]}>{activity.status}</Tag> },
              { key: 'date', label: '活动日期', children: activity.date },
              { key: 'location', label: '地点', children: activity.location },
              { key: 'organizer', label: '组织单位', children: activity.organizer, span: 2 },
              { key: 'created', label: '登记时间', children: activity.createdAt },
            ]}
          />
          <div className="drawer-section-title">参加代表（{parts.length} 人）</div>
          <Space wrap>
            {parts.map((d) => (
              <Tag key={d.id} color="green">{d.name}（{d.town}）</Tag>
            ))}
          </Space>
          <div className="drawer-section-title">活动纪要</div>
          <p style={{ whiteSpace: 'pre-wrap', background: '#f1f6f5', padding: 12, borderRadius: 8 }}>{activity.summary || '暂无纪要'}</p>
        </>
      )}
    </Drawer>
  );
}