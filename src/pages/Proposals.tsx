import { useMemo, useState } from 'react';
import {
  App as AntApp, Alert, Button, Card, DatePicker, Descriptions, Drawer, Form, Input, Modal,
  Popconfirm, Radio, Select, Space, Table, Tag, Timeline,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { Proposal, ProposalCategory, ProposalStatus, Satisfaction } from '../types';
import { useStore } from '../store/AppStore';
import { HANDLER_ORGS } from '../mocks/proposals';
import { downloadCSV } from '../utils/csv';

const CATS: ProposalCategory[] = ['城乡建设', '交通出行', '民生保障', '教育医疗', '生态环境', '乡村振兴', '其他'];
const STATUS_COLORS: Record<ProposalStatus, string> = {
  待审核: 'orange', 已交办: 'blue', 办理中: 'geekblue', 已答复: 'cyan', 已评价: 'green', 已退回: 'red',
};

/** 流转时间线节点颜色：按动作关键词区分 */
function flowColor(action: string): string {
  if (action.includes('退回') || action.includes('不满意')) return 'red';
  if (action.includes('评价') || action.includes('办结')) return 'green';
  if (action.includes('答复')) return '#13c2c2';
  if (action.includes('受理')) return '#d6a044';
  if (action.includes('交办')) return 'blue';
  return 'gray';
}

interface AssignFormValues { org: string; deadline: Dayjs }
interface ReplyFormValues { reply: string }
interface EvalFormValues { satisfaction: Satisfaction }
interface CreateFormValues { title: string; category: ProposalCategory; content: string; proposerId?: string }

/**
 * 提案建议交办：完整闭环工作流（管理员推动流转，代表评价）。
 * 待审核 --审核交办--> 已交办 --登记受理--> 办理中 --登记答复--> 已答复
 *      --满意度评价--> 满意/基本满意 → 已评价（办结）；不满意 → 已退回 --再次交办--> 已交办
 */
export default function Proposals() {
  const { user, deputies, proposals, addProposal, assignProposal, acceptProposal, replyProposal, evaluateProposal } = useStore();
  const { message } = AntApp.useApp();
  const isAdmin = user?.role === 'admin';

  const [kw, setKw] = useState('');
  const [status, setStatus] = useState<ProposalStatus | undefined>();
  const [category, setCategory] = useState<ProposalCategory | undefined>();
  const [detailId, setDetailId] = useState<string>();
  const [assignId, setAssignId] = useState<string>();
  const [replyId, setReplyId] = useState<string>();
  const [evalId, setEvalId] = useState<string>();
  const [createOpen, setCreateOpen] = useState(false);

  const [assignForm] = Form.useForm<AssignFormValues>();
  const [replyForm] = Form.useForm<ReplyFormValues>();
  const [evalForm] = Form.useForm<EvalFormValues>();
  const [createForm] = Form.useForm<CreateFormValues>();

  const nameOf = (id: string) => deputies.find((d) => d.id === id)?.name ?? id;

  /** 代表角色：本人领衔或附议的建议 */
  const base = isAdmin ? proposals : proposals.filter((p) => p.proposerId === user?.deputyId || p.cosponsorIds.includes(user?.deputyId ?? ''));

  const list = useMemo(
    () =>
      base.filter(
        (p) =>
          (!kw || p.title.includes(kw) || p.id.includes(kw)) &&
          (!status || p.status === status) &&
          (!category || p.category === category),
      ),
    [base, kw, status, category],
  );

  const assignTarget = proposals.find((p) => p.id === assignId);

  const openAssign = (p: Proposal) => {
    setAssignId(p.id);
    assignForm.setFieldsValue({
      org: p.handlerOrg,
      deadline: p.deadline ? dayjs(p.deadline) : dayjs().add(90, 'day'),
    });
  };

  const onAssignFinish = (v: AssignFormValues) => {
    if (!assignId) return;
    assignProposal(assignId, v.org, v.deadline.format('YYYY-MM-DD'), user?.name ?? '');
    message.success('已交办至' + v.org);
    setAssignId(undefined);
  };

  const onReplyFinish = (v: ReplyFormValues) => {
    if (!replyId) return;
    replyProposal(replyId, v.reply, user?.name ?? '');
    message.success('答复已登记');
    setReplyId(undefined);
  };

  const onEvalFinish = (v: EvalFormValues) => {
    if (!evalId) return;
    evaluateProposal(evalId, v.satisfaction, user?.name ?? '');
    message.success(v.satisfaction === '不满意' ? '已退回承办单位重新办理' : '评价完成，建议办结');
    setEvalId(undefined);
  };

  const onCreateFinish = (v: CreateFormValues) => {
    const proposerId = isAdmin ? v.proposerId : user?.deputyId;
    if (!proposerId) {
      message.warning('请选择领衔代表');
      return;
    }
    addProposal(
      {
        title: v.title,
        category: v.category,
        content: v.content,
        proposerId,
        cosponsorIds: [],
        submittedAt: dayjs().format('YYYY-MM-DD HH:mm'),
      },
      user?.name ?? nameOf(proposerId),
    );
    message.success('建议已提交，等待人大主席团审核交办');
    setCreateOpen(false);
  };

  const exportCSV = () => {
    downloadCSV(
      '提案建议交办_' + dayjs().format('YYYYMMDD') + '.csv',
      ['编号', '标题', '分类', '领衔代表', '提交时间', '状态', '承办单位', '交办时间', '办理期限', '满意度', '案由建议'],
      list.map((p) => [
        p.id, p.title, p.category, nameOf(p.proposerId), p.submittedAt, p.status,
        p.handlerOrg ?? '', p.assignedAt ?? '', p.deadline ?? '', p.satisfaction ?? '', p.content,
      ]),
    );
    message.success('已导出 CSV（' + list.length + ' 条）');
  };

  const columns: ColumnsType<Proposal> = [
    { title: '编号', dataIndex: 'id', width: 112 },
    { title: '标题', dataIndex: 'title', ellipsis: true, render: (t: string) => <b>{t}</b> },
    { title: '分类', dataIndex: 'category', width: 92 },
    { title: '领衔代表', key: 'proposer', width: 92, render: (_, p) => nameOf(p.proposerId) },
    { title: '提交时间', dataIndex: 'submittedAt', width: 100, render: (v: string) => v.slice(0, 10), sorter: (a, b) => a.submittedAt.localeCompare(b.submittedAt) },
    { title: '承办单位', dataIndex: 'handlerOrg', width: 150, ellipsis: true, render: (v?: string) => v ?? '—' },
    { title: '状态', dataIndex: 'status', width: 84, render: (s: ProposalStatus) => <Tag color={STATUS_COLORS[s]}>{s}</Tag> },
    {
      title: '满意度',
      dataIndex: 'satisfaction',
      width: 88,
      render: (s?: Satisfaction) => (s ? <Tag color={s === '满意' ? 'green' : s === '基本满意' ? 'gold' : 'red'}>{s}</Tag> : '—'),
    },
    {
      title: '操作',
      key: 'op',
      width: 170,
      fixed: 'right',
      render: (_, p) => (
        <Space size={0} wrap>
          <Button type="link" size="small" onClick={() => setDetailId(p.id)}>详情</Button>
          {/* 管理员按状态推动流转；代表仅能对自己领衔的已答复建议评价 */}
          {isAdmin && p.status === '待审核' && <Button type="link" size="small" onClick={() => openAssign(p)}>审核交办</Button>}
          {isAdmin && p.status === '已交办' && (
            <Popconfirm
              title="确认登记为承办单位已受理？"
              okText="确认"
              cancelText="取消"
              onConfirm={() => {
                acceptProposal(p.id, p.handlerOrg ?? '');
                message.success('已登记受理，进入办理阶段');
              }}
            >
              <Button type="link" size="small">登记受理</Button>
            </Popconfirm>
          )}
          {isAdmin && p.status === '办理中' && (
            <Button type="link" size="small" onClick={() => { setReplyId(p.id); replyForm.resetFields(); }}>登记答复</Button>
          )}
          {isAdmin && p.status === '已退回' && <Button type="link" size="small" onClick={() => openAssign(p)}>再次交办</Button>}
          {!isAdmin && p.status === '已答复' && p.proposerId === user?.deputyId && (
            <Button type="link" size="small" onClick={() => { setEvalId(p.id); evalForm.resetFields(); }}>满意度评价</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="交办流程：待审核 → 审核交办 → 受理 → 办理中 → 登记答复 → 代表满意度评价（不满意可退回重办）"
        description="每次状态变更都会写入流转记录，可在详情抽屉中查看完整时间线。"
      />
      <Card size="small">
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search allowClear placeholder="搜索标题 / 编号" style={{ width: 220 }} value={kw} onChange={(e) => setKw(e.target.value)} />
          <Select allowClear placeholder="状态" style={{ width: 120 }} value={status} onChange={setStatus} options={(Object.keys(STATUS_COLORS) as ProposalStatus[]).map((s) => ({ value: s, label: s }))} />
          <Select allowClear placeholder="分类" style={{ width: 130 }} value={category} onChange={setCategory} options={CATS.map((c) => ({ value: c, label: c }))} />
          <Button icon={<PlusOutlined />} type="primary" onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
            {isAdmin ? '新增登记' : '提交建议'}
          </Button>
          {isAdmin && <Button icon={<DownloadOutlined />} onClick={exportCSV}>导出 CSV</Button>}
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={list}
          size="middle"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => '共 ' + t + ' 件建议' }}
        />
      </Card>

      <ProposalDrawer proposalId={detailId} onClose={() => setDetailId(undefined)} />

      {/* 审核交办 / 再次交办：指定承办单位与办理期限 */}
      <Modal
        open={!!assignId}
        title={assignTarget?.status === '已退回' ? '退回件再次交办' : '审核通过并交办'}
        okText="交办"
        cancelText="取消"
        onOk={() => assignForm.submit()}
        onCancel={() => setAssignId(undefined)}
      >
        <Form form={assignForm} layout="vertical" onFinish={onAssignFinish}>
          <Form.Item name="org" label="承办单位" rules={[{ required: true, message: '请选择承办单位' }]}>
            <Select showSearch placeholder="选择承办单位" options={HANDLER_ORGS.map((o) => ({ value: o, label: o }))} />
          </Form.Item>
          <Form.Item name="deadline" label="办理期限" rules={[{ required: true, message: '请选择办理期限' }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isBefore(dayjs(), 'day')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 登记答复 */}
      <Modal
        open={!!replyId}
        title="登记答复"
        okText="保存答复"
        cancelText="取消"
        onOk={() => replyForm.submit()}
        onCancel={() => setReplyId(undefined)}
      >
        <Form form={replyForm} layout="vertical" onFinish={onReplyFinish}>
          <Form.Item name="reply" label="答复内容" rules={[{ required: true, message: '请填写答复内容' }]}>
            <Input.TextArea rows={4} placeholder="填写向领衔代表反馈的办理与答复情况" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 领衔代表满意度评价 */}
      <Modal
        open={!!evalId}
        title="满意度评价（领衔代表）"
        okText="提交评价"
        cancelText="取消"
        onOk={() => evalForm.submit()}
        onCancel={() => setEvalId(undefined)}
      >
        <Form form={evalForm} layout="vertical" onFinish={onEvalFinish}>
          <Form.Item name="satisfaction" label="对办理结果的满意度" rules={[{ required: true, message: '请选择评价' }]}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '满意', value: '满意' },
                { label: '基本满意', value: '基本满意' },
                { label: '不满意', value: '不满意' },
              ]}
            />
          </Form.Item>
          <Alert type="info" showIcon message="评价“不满意”将退回承办单位重新办理。" />
        </Form>
      </Modal>

      {/* 新增登记 / 代表提交建议 */}
      <Modal
        open={createOpen}
        title={isAdmin ? '新增建议登记' : '提交建议'}
        width={640}
        okText="提交"
        cancelText="取消"
        onOk={() => createForm.submit()}
        onCancel={() => setCreateOpen(false)}
      >
        <Form form={createForm} layout="vertical" onFinish={onCreateFinish}>
          {isAdmin && (
            <Form.Item name="proposerId" label="领衔代表" rules={[{ required: true, message: '请选择领衔代表' }]}>
              <Select showSearch optionFilterProp="label" placeholder="选择领衔代表" options={deputies.map((d) => ({ value: d.id, label: d.name + '（' + d.town + '）' }))} />
            </Form.Item>
          )}
          <Form.Item name="title" label="建议标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="如：关于××××的建议" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select options={CATS.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item name="content" label="案由及建议内容" rules={[{ required: true, message: '请填写案由与建议' }]}>
            <Input.TextArea rows={5} placeholder="说明现状与问题，并提出具体建议" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

/** 建议详情抽屉：基本信息 + 案由/答复 + 交办流转时间线 */
function ProposalDrawer({ proposalId, onClose }: { proposalId: string | undefined; onClose: () => void }) {
  const { deputies, proposals } = useStore();
  const proposal = proposalId ? proposals.find((p) => p.id === proposalId) : undefined;
  const nameOf = (id: string) => deputies.find((d) => d.id === id)?.name ?? id;

  return (
    <Drawer open={!!proposal} onClose={onClose} width={760} title={proposal ? proposal.id + ' · ' + proposal.title : ''}>
      {proposal && (
        <>
          <Descriptions
            bordered
            size="small"
            column={2}
            items={[
              { key: 'cat', label: '分类', children: proposal.category },
              { key: 'proposer', label: '领衔代表', children: nameOf(proposal.proposerId) },
              { key: 'cos', label: '附议代表', children: proposal.cosponsorIds.length ? proposal.cosponsorIds.map(nameOf).join('、') : '—' },
              { key: 'submitted', label: '提交时间', children: proposal.submittedAt },
              { key: 'org', label: '承办单位', children: proposal.handlerOrg ?? '—' },
              { key: 'assigned', label: '交办时间', children: proposal.assignedAt ?? '—' },
              { key: 'deadline', label: '办理期限', children: proposal.deadline ?? '—' },
              { key: 'replied', label: '答复时间', children: proposal.repliedAt ?? '—' },
              {
                key: 'sat',
                label: '满意度评价',
                children: proposal.satisfaction ? (
                  <Tag color={proposal.satisfaction === '满意' ? 'green' : proposal.satisfaction === '基本满意' ? 'gold' : 'red'}>
                    {proposal.satisfaction}
                  </Tag>
                ) : (
                  '—'
                ),
              },
              { key: 'status', label: '当前状态', children: <Tag color={STATUS_COLORS[proposal.status]}>{proposal.status}</Tag> },
            ]}
          />
          <div className="drawer-section-title">案由及建议内容</div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{proposal.content}</p>
          {proposal.reply && (
            <>
              <div className="drawer-section-title">答复内容</div>
              <p style={{ whiteSpace: 'pre-wrap', background: '#f1f6f5', padding: 12, borderRadius: 8 }}>{proposal.reply}</p>
            </>
          )}
          <div className="drawer-section-title">交办流转记录</div>
          <Timeline
            items={[...proposal.flow]
              .reverse()
              .map((fr) => ({
                color: flowColor(fr.action),
                children: (
                  <>
                    <span className="tabular-nums">{fr.time}</span> · <b>{fr.actor}</b> — {fr.action}
                    {fr.note ? <div style={{ color: '#637674', fontSize: 12 }}>{fr.note}</div> : null}
                  </>
                ),
              }))}
          />
        </>
      )}
    </Drawer>
  );
}