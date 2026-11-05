import dayjs from 'dayjs';
import type { Activity, ActivityStatus, ActivityType } from '../types';
import { mockDeputies } from './deputies';
import { createRng, pick, pickSome } from './rng';

const rng = createRng(20250302);
const ids = mockDeputies.map((d) => d.id);

/** 活动主题素材（按类型） */
const titleByType: Record<ActivityType, string[]> = {
  调研视察: ['农村人居环境整治情况视察', '镇工业园区企业用工情况调研', '高标准农田建设专题调研', '镇区雨污分流改造工程视察', '敬老院运营管理情况视察', '校园食品安全专项检查'],
  约见镇长: ['约见镇长：集镇路灯改造问题', '约见镇长：农村饮水安全工程进度', '约见镇长：镇卫生院药品保障问题'],
  代表述职: ['第五代表小组年度述职会', '城关镇代表联络站述职评议会', '镇人大代表年度述职大会'],
  学习培训: ['新任代表初任培训', '代表履职能力提升专题培训', '宪法与代表法专题学习会'],
};
const places = ['镇政府三楼会议室', '城关镇代表联络站', '向阳村党群服务中心', '镇工业园区管委会', '镇敬老院', '镇中心小学', '柳河镇集市广场'];
const organizers = ['镇人大主席团', '第五代表小组', '城关镇代表联络站', '镇人大办公室'];

/** 手写 4 条重点活动（纪要完整），日期相对当天生成，保证仪表盘始终有近期数据 */
const seeds: Array<Omit<Activity, 'id' | 'createdAt'>> = [
  {
    type: '调研视察',
    title: '农村人居环境整治情况视察',
    date: dayjs().subtract(1, 'month').date(12).format('YYYY-MM-DD'),
    location: '向阳村党群服务中心',
    organizer: '镇人大主席团',
    participantIds: pickSome(rng, ids, 8),
    status: '已完成',
    summary: '视察组先后查看向阳村、柳河村垃圾清运点和污水管网施工现场，发现部分点位清运不及时、沟渠淤塞等问题 3 项，已现场交办镇政府相关部门限期整改，并将组织跟踪复查。',
  },
  {
    type: '约见镇长',
    title: '约见镇长：集镇路灯改造问题',
    date: dayjs().subtract(20, 'day').format('YYYY-MM-DD'),
    location: '镇政府三楼会议室',
    organizer: '镇人大主席团',
    participantIds: pickSome(rng, ids, 5),
    status: '已完成',
    summary: '5 名代表就集镇背街小巷路灯破损、照明盲区问题联合约见镇长。镇长现场答复：已列入本年度镇政府民生实事，分两批改造 186 盏，首批 10 月底前完工，代表对答复表示满意。',
  },
  {
    type: '代表述职',
    title: '第五代表小组年度述职会',
    date: dayjs().subtract(2, 'month').date(25).format('YYYY-MM-DD'),
    location: '城关镇代表联络站',
    organizer: '第五代表小组',
    participantIds: pickSome(rng, ids, 6),
    status: '已完成',
    summary: '小组 6 名代表逐一述职并接受选民代表评议，围绕联系群众、建议提交、参加活动等情况汇报，测评结果均为称职以上，评议意见已反馈本人。',
  },
  {
    type: '学习培训',
    title: '新任代表初任培训',
    date: dayjs().add(15, 'day').format('YYYY-MM-DD'),
    location: '镇政府三楼会议室',
    organizer: '镇人大办公室',
    participantIds: pickSome(rng, ids, 10),
    status: '计划中',
    summary: '组织新当选代表集中学习代表法、议事规则与建议撰写规范，并安排连任老代表作履职经验交流。',
  },
];

/** 其余 14 条均匀覆盖近 6 个月，类型按真实工作频率分布（调研视察最多） */
const typePool: ActivityType[] = ['调研视察', '调研视察', '调研视察', '约见镇长', '代表述职', '学习培训'];

const generated: Array<Omit<Activity, 'id' | 'createdAt'>> = [];
for (let i = 0; i < 14; i++) {
  const type = typePool[i % typePool.length];
  const monthOffset = Math.floor((i * 6) / 14);
  const day = 1 + Math.floor(rng() * 27);
  const date = dayjs().subtract(monthOffset, 'month').date(day);
  const isFuture = date.isAfter(dayjs(), 'day');
  const status: ActivityStatus = rng() < 0.08 ? '已取消' : isFuture ? '计划中' : '已完成';
  generated.push({
    type,
    title: pick(rng, titleByType[type]),
    date: date.format('YYYY-MM-DD'),
    location: pick(rng, places),
    organizer: pick(rng, organizers),
    participantIds: pickSome(rng, ids, 3 + Math.floor(rng() * 6)),
    status,
    summary:
      status === '已取消'
        ? '因天气原因延期举行，具体时间另行通知。'
        : status === '已完成'
          ? type + '活动按计划开展，形成活动记录并归档，相关意见建议已转交有关方面研究处理。'
          : type + '活动筹备中，相关安排已提前通知参加代表。',
  });
}

/** 按日期倒序编号导出（最新活动编号最小） */
export const mockActivities: Activity[] = [...seeds, ...generated]
  .sort((a, b) => b.date.localeCompare(a.date))
  .map((a, i) => ({
    ...a,
    id: 'HD' + dayjs().year() + '-' + String(i + 1).padStart(3, '0'),
    createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
  }));