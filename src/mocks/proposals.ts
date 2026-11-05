import dayjs from 'dayjs';
import type { FlowRecord, Proposal, ProposalCategory, ProposalStatus, Satisfaction } from '../types';
import { mockDeputies } from './deputies';
import { createRng, pick, pickSome } from './rng';

const rng = createRng(20250303);
const ids = mockDeputies.map((d) => d.id);
const nameOf = (id: string) => mockDeputies.find((d) => d.id === id)?.name ?? id;
const f = (time: string, actor: string, action: string, note?: string): FlowRecord => ({ time, actor, action, note });

/** 交办常用承办单位（页面下拉与 mock 共用） */
export const HANDLER_ORGS = ['镇人民政府办公室', '镇村镇建设服务中心', '镇农业农村服务中心', '镇社会事务服务中心', '城关派出所', '镇中心学校', '镇卫生院', '供电所'];

type Draft = Omit<Proposal, 'id'>;

/** 手写 8 条：覆盖全部 6 种状态，交办链路完整 */
const drafts: Draft[] = [
  {
    title: '关于整治集贸市场占道经营的建议', category: '城乡建设',
    proposerId: 'DB0001', cosponsorIds: ['DB0008', 'DB0005'],
    submittedAt: dayjs().subtract(6, 'day').hour(9).minute(30).format('YYYY-MM-DD HH:mm'),
    content: '镇集贸市场周边摊贩占道经营，早晚高峰人车混行、通行困难，且存在消防隐患。建议划定经营区域、明确开闭市时间，并由市场监管与城管部门联合巡查，还路于民。',
    status: '待审核',
    flow: [f(dayjs().subtract(6, 'day').hour(9).minute(30).format('YYYY-MM-DD HH:mm'), nameOf('DB0001'), '提交建议')],
  },
  {
    title: '关于实施村内路灯亮化工程的建议', category: '城乡建设',
    proposerId: 'DB0003', cosponsorIds: ['DB0011', 'DB0014'],
    submittedAt: dayjs().subtract(25, 'day').hour(10).minute(0).format('YYYY-MM-DD HH:mm'),
    content: '柳河镇多个村组主干道无路灯，夜间出行不安全。建议按“先主干道后支巷”的顺序实施亮化工程，选用节能灯具，并明确后期管护责任单位。',
    status: '已交办', handlerOrg: '镇村镇建设服务中心',
    assignedAt: dayjs().subtract(15, 'day').hour(15).minute(0).format('YYYY-MM-DD HH:mm'),
    deadline: dayjs().add(75, 'day').format('YYYY-MM-DD'),
    flow: [
      f(dayjs().subtract(25, 'day').hour(10).minute(0).format('YYYY-MM-DD HH:mm'), nameOf('DB0003'), '提交建议'),
      f(dayjs().subtract(15, 'day').hour(15).minute(0).format('YYYY-MM-DD HH:mm'), '人大主席团', '审核通过并交办至镇村镇建设服务中心', '办理期限：' + dayjs().add(75, 'day').format('YYYY-MM-DD')),
    ],
  },
  {
    title: '关于缓解镇中心小学门口上下学交通拥堵的建议', category: '交通出行',
    proposerId: 'DB0004', cosponsorIds: ['DB0009'],
    submittedAt: dayjs().subtract(40, 'day').hour(9).minute(0).format('YYYY-MM-DD HH:mm'),
    content: '上下学高峰时段校门口车辆乱停乱放，人车混行安全隐患突出。建议增设临时停靠区和护学岗，高峰时段实行单向通行，并施划人行横道线。',
    status: '办理中', handlerOrg: '城关派出所',
    assignedAt: dayjs().subtract(28, 'day').hour(14).minute(30).format('YYYY-MM-DD HH:mm'),
    deadline: dayjs().add(60, 'day').format('YYYY-MM-DD'),
    flow: [
      f(dayjs().subtract(40, 'day').hour(9).minute(0).format('YYYY-MM-DD HH:mm'), nameOf('DB0004'), '提交建议'),
      f(dayjs().subtract(28, 'day').hour(14).minute(30).format('YYYY-MM-DD HH:mm'), '人大主席团', '审核通过并交办至城关派出所', '办理期限：' + dayjs().add(60, 'day').format('YYYY-MM-DD')),
      f(dayjs().subtract(22, 'day').hour(10).minute(0).format('YYYY-MM-DD HH:mm'), '城关派出所', '承办单位受理，进入办理阶段'),
    ],
  },
  {
    title: '关于解决部分村组自来水水压不足的建议', category: '民生保障',
    proposerId: 'DB0005', cosponsorIds: ['DB0013'],
    submittedAt: dayjs().subtract(70, 'day').hour(8).minute(40).format('YYYY-MM-DD HH:mm'),
    content: '石桥镇部分地势较高村组自来水水压不足，高峰时段高层住户无法正常用水。建议排查管网并增设加压设施，保障群众基本生活用水。',
    status: '已答复', handlerOrg: '镇农业农村服务中心',
    assignedAt: dayjs().subtract(60, 'day').hour(11).minute(0).format('YYYY-MM-DD HH:mm'),
    deadline: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    reply: '经排查为管网老化与加压泵站不足所致，已更换主管道 1.2 公里、新增加压泵 2 台，出水压力恢复正常，并建立季度巡检制度，现将办理情况书面答复。',
    repliedAt: dayjs().subtract(20, 'day').hour(16).minute(0).format('YYYY-MM-DD HH:mm'),
    flow: [
      f(dayjs().subtract(70, 'day').hour(8).minute(40).format('YYYY-MM-DD HH:mm'), nameOf('DB0005'), '提交建议'),
      f(dayjs().subtract(60, 'day').hour(11).minute(0).format('YYYY-MM-DD HH:mm'), '人大主席团', '审核通过并交办至镇农业农村服务中心', '办理期限：' + dayjs().add(30, 'day').format('YYYY-MM-DD')),
      f(dayjs().subtract(52, 'day').hour(9).minute(30).format('YYYY-MM-DD HH:mm'), '镇农业农村服务中心', '承办单位受理，进入办理阶段'),
      f(dayjs().subtract(20, 'day').hour(16).minute(0).format('YYYY-MM-DD HH:mm'), '镇农业农村服务中心', '向领衔代表答复并送达答复函'),
    ],
  },
  {
    title: '关于硬化机耕道连接高标准农田的建议', category: '乡村振兴',
    proposerId: 'DB0001', cosponsorIds: ['DB0003', 'DB0016'],
    submittedAt: dayjs().subtract(120, 'day').hour(9).minute(20).format('YYYY-MM-DD HH:mm'),
    content: '向阳村 800 亩高标准农田田间道路仍是土路，农机进出与粮食运输不便。建议将 2.3 公里机耕道纳入硬化计划，配套错车道和排水沟。',
    status: '已评价', satisfaction: '满意',
    handlerOrg: '镇农业农村服务中心',
    assignedAt: dayjs().subtract(110, 'day').hour(15).minute(0).format('YYYY-MM-DD HH:mm'),
    deadline: dayjs().subtract(20, 'day').format('YYYY-MM-DD'),
    reply: '已将 2.3 公里机耕道硬化纳入本季度农村基础设施项目并完工验收，配套错车道 6 处、排水沟 1.8 公里。',
    repliedAt: dayjs().subtract(40, 'day').hour(10).minute(30).format('YYYY-MM-DD HH:mm'),
    evaluatedAt: dayjs().subtract(30, 'day').hour(9).minute(0).format('YYYY-MM-DD HH:mm'),
    flow: [
      f(dayjs().subtract(120, 'day').hour(9).minute(20).format('YYYY-MM-DD HH:mm'), nameOf('DB0001'), '提交建议'),
      f(dayjs().subtract(110, 'day').hour(15).minute(0).format('YYYY-MM-DD HH:mm'), '人大主席团', '审核通过并交办至镇农业农村服务中心', '办理期限：' + dayjs().subtract(20, 'day').format('YYYY-MM-DD')),
      f(dayjs().subtract(100, 'day').hour(9).minute(0).format('YYYY-MM-DD HH:mm'), '镇农业农村服务中心', '承办单位受理，进入办理阶段'),
      f(dayjs().subtract(40, 'day').hour(10).minute(30).format('YYYY-MM-DD HH:mm'), '镇农业农村服务中心', '向领衔代表答复并送达答复函'),
      f(dayjs().subtract(30, 'day').hour(9).minute(0).format('YYYY-MM-DD HH:mm'), nameOf('DB0001'), '满意度评价：满意，办结'),
    ],
  },
  {
    title: '关于更新敬老院冬季供暖设备的建议', category: '民生保障',
    proposerId: 'DB0002', cosponsorIds: ['DB0010'],
    submittedAt: dayjs().subtract(150, 'day').hour(14).minute(0).format('YYYY-MM-DD HH:mm'),
    content: '镇敬老院供暖设备老化，冬季室温不达标，老人反映强烈。建议更换供暖锅炉并为居室加装保温窗帘，保障特困供养人员温暖过冬。',
    status: '已评价', satisfaction: '基本满意',
    handlerOrg: '镇社会事务服务中心',
    assignedAt: dayjs().subtract(140, 'day').hour(10).minute(0).format('YYYY-MM-DD HH:mm'),
    deadline: dayjs().subtract(50, 'day').format('YYYY-MM-DD'),
    reply: '供暖锅炉已更换并调试完毕，居室保温改造完成 60%，剩余部分列入下年度预算，此前已采取临时取暖措施过渡。',
    repliedAt: dayjs().subtract(70, 'day').hour(15).minute(30).format('YYYY-MM-DD HH:mm'),
    evaluatedAt: dayjs().subtract(60, 'day').hour(9).minute(30).format('YYYY-MM-DD HH:mm'),
    flow: [
      f(dayjs().subtract(150, 'day').hour(14).minute(0).format('YYYY-MM-DD HH:mm'), nameOf('DB0002'), '提交建议'),
      f(dayjs().subtract(140, 'day').hour(10).minute(0).format('YYYY-MM-DD HH:mm'), '人大主席团', '审核通过并交办至镇社会事务服务中心', '办理期限：' + dayjs().subtract(50, 'day').format('YYYY-MM-DD')),
      f(dayjs().subtract(132, 'day').hour(9).minute(0).format('YYYY-MM-DD HH:mm'), '镇社会事务服务中心', '承办单位受理，进入办理阶段'),
      f(dayjs().subtract(70, 'day').hour(15).minute(30).format('YYYY-MM-DD HH:mm'), '镇社会事务服务中心', '向领衔代表答复并送达答复函'),
      f(dayjs().subtract(60, 'day').hour(9).minute(30).format('YYYY-MM-DD HH:mm'), nameOf('DB0002'), '满意度评价：基本满意，办结', '部分改造项目列入下年度预算'),
    ],
  },
  {
    title: '关于加强镇卫生院夜间急诊值班力量的建议', category: '教育医疗',
    proposerId: 'DB0006', cosponsorIds: ['DB0009', 'DB0018'],
    submittedAt: dayjs().subtract(100, 'day').hour(8).minute(50).format('YYYY-MM-DD HH:mm'),
    content: '镇卫生院夜间急诊仅 1 名值班医生，遇到多人就诊时力量不足，群众反映排队时间长。建议合理排班增派夜间人手，并与上级医院建立轮岗支援机制。',
    status: '已退回', satisfaction: '不满意',
    handlerOrg: '镇卫生院',
    assignedAt: dayjs().subtract(90, 'day').hour(14).minute(0).format('YYYY-MM-DD HH:mm'),
    deadline: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
    reply: '已与镇卫生院沟通，表示将在就诊高峰期适当增派人手。',
    repliedAt: dayjs().subtract(30, 'day').hour(11).minute(0).format('YYYY-MM-DD HH:mm'),
    evaluatedAt: dayjs().subtract(25, 'day').hour(9).minute(40).format('YYYY-MM-DD HH:mm'),
    flow: [
      f(dayjs().subtract(100, 'day').hour(8).minute(50).format('YYYY-MM-DD HH:mm'), nameOf('DB0006'), '提交建议'),
      f(dayjs().subtract(90, 'day').hour(14).minute(0).format('YYYY-MM-DD HH:mm'), '人大主席团', '审核通过并交办至镇卫生院', '办理期限：' + dayjs().subtract(10, 'day').format('YYYY-MM-DD')),
      f(dayjs().subtract(80, 'day').hour(9).minute(0).format('YYYY-MM-DD HH:mm'), '镇卫生院', '承办单位受理，进入办理阶段'),
      f(dayjs().subtract(30, 'day').hour(11).minute(0).format('YYYY-MM-DD HH:mm'), '镇卫生院', '向领衔代表答复并送达答复函'),
      f(dayjs().subtract(25, 'day').hour(9).minute(40).format('YYYY-MM-DD HH:mm'), nameOf('DB0006'), '满意度评价：不满意，退回重办', '答复措施不具体，要求补充人员排班方案后重新办理'),
    ],
  },
  {
    title: '关于打通快递进村“最后一公里”的建议', category: '乡村振兴',
    proposerId: 'DB0008', cosponsorIds: ['DB0012'],
    submittedAt: dayjs().subtract(3, 'day').hour(10).minute(10).format('YYYY-MM-DD HH:mm'),
    content: '多数行政村未设快递服务点，村民取件需到镇区，往返不便。建议依托村超市、党群服务中心布设快递代收点，推动邮快合作、快快合作共同配送。',
    status: '待审核',
    flow: [f(dayjs().subtract(3, 'day').hour(10).minute(10).format('YYYY-MM-DD HH:mm'), nameOf('DB0008'), '提交建议')],
  },
];

/** 程序化补齐 12 条：状态按真实流程分布，时间链保持“提交<交办<受理<答复<评价” */
const genSpecs: Array<[string, ProposalCategory]> = [
  ['增设镇区公交站台候车亭', '交通出行'],
  ['农村道路错车道改造', '交通出行'],
  ['加强农村生活垃圾分类清运', '生态环境'],
  ['村卫生室常用药品品种补充', '教育医疗'],
  ['田间机井电力设施改造', '乡村振兴'],
  ['河道清淤与防汛隐患整治', '生态环境'],
  ['镇区停车位规划与管理', '城乡建设'],
  ['留守儿童课后托管服务', '教育医疗'],
  ['特色农产品电商助农培训', '乡村振兴'],
  ['村口公路减速带与警示标志安装', '交通出行'],
  ['社区养老助餐点建设', '民生保障'],
  ['农田灌溉渠系修缮', '乡村振兴'],
];
const statusPool: ProposalStatus[] = ['已交办', '已交办', '办理中', '办理中', '已答复', '已答复', '已评价', '已评价', '待审核', '待审核', '已退回', '已交办'];
const satPool: Satisfaction[] = ['满意', '满意', '基本满意', '满意', '基本满意'];

const genDrafts: Draft[] = genSpecs.map((spec, i) => {
  const status = statusPool[i % statusPool.length];
  const monthsAgo = status === '待审核' ? Math.floor(rng() * 2) : 2 + Math.floor(rng() * 4);
  const submittedAt = dayjs().subtract(monthsAgo, 'month').subtract(Math.floor(rng() * 10), 'day').hour(9).minute(30);
  const proposerId = pick(rng, ids);
  const cosponsorIds = pickSome(rng, ids, 1 + Math.floor(rng() * 3)).filter((x) => x !== proposerId);
  const flow: FlowRecord[] = [f(submittedAt.format('YYYY-MM-DD HH:mm'), nameOf(proposerId), '提交建议')];
  const draft: Draft = {
    title: '关于' + spec[0] + '的建议',
    category: spec[1],
    proposerId,
    cosponsorIds,
    submittedAt: submittedAt.format('YYYY-MM-DD HH:mm'),
    content: '反映' + spec[0] + '方面存在的问题，建议镇政府及相关站所尽快实地核查，制定实施方案，明确责任人与完成时限，办理进展及时向代表和群众反馈。',
    status,
    flow,
  };
  if (status !== '待审核') {
    const org = pick(rng, HANDLER_ORGS);
    const assignedAt = submittedAt.add(8, 'day');
    const deadline = assignedAt.add(90, 'day').format('YYYY-MM-DD');
    draft.handlerOrg = org;
    draft.assignedAt = assignedAt.format('YYYY-MM-DD HH:mm');
    draft.deadline = deadline;
    flow.push(f(assignedAt.format('YYYY-MM-DD HH:mm'), '人大主席团', '审核通过并交办至' + org, '办理期限：' + deadline));
    if (status !== '已交办') {
      const acceptedAt = assignedAt.add(5, 'day');
      flow.push(f(acceptedAt.format('YYYY-MM-DD HH:mm'), org, '承办单位受理，进入办理阶段'));
      if (status === '已答复' || status === '已评价' || status === '已退回') {
        const repliedAt = assignedAt.add(35, 'day');
        draft.reply = '已会同相关站所实地核查，明确整改措施与责任人，办理情况已书面答复领衔代表。';
        draft.repliedAt = repliedAt.format('YYYY-MM-DD HH:mm');
        flow.push(f(repliedAt.format('YYYY-MM-DD HH:mm'), org, '向领衔代表答复并送达答复函'));
        if (status === '已评价' || status === '已退回') {
          const sat: Satisfaction = status === '已评价' ? pick(rng, satPool) : '不满意';
          const evaluatedAt = repliedAt.add(8, 'day');
          draft.satisfaction = sat;
          draft.evaluatedAt = evaluatedAt.format('YYYY-MM-DD HH:mm');
          flow.push(
            sat === '不满意'
              ? f(evaluatedAt.format('YYYY-MM-DD HH:mm'), nameOf(proposerId), '满意度评价：不满意，退回重办', '要求承办单位补充具体措施后重新办理')
              : f(evaluatedAt.format('YYYY-MM-DD HH:mm'), nameOf(proposerId), '满意度评价：' + sat + '，办结'),
          );
        }
      }
    }
  }
  return draft;
});

/** 按提交时间升序编号导出（模拟“大会第 N 号”建议编号） */
export const mockProposals: Proposal[] = [...drafts, ...genDrafts]
  .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  .map((p, i) => ({ ...p, id: 'JY' + dayjs().year() + '-' + String(i + 1).padStart(3, '0') }));