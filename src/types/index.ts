/** 系统角色：管理员（人大办/主席团）、人大代表、承办单位（部门办理人员） */
export type Role = 'admin' | 'deputy' | 'handler';

/** mock 登录用户；代表角色通过 deputyId 绑定到具体代表档案 */
export interface User {
  id: string;
  name: string;
  role: Role;
  /** 代表角色对应的代表档案 id，管理员为空 */
  deputyId?: string;
  /** 承办单位角色绑定的单位名称（对应提案 handlerOrg） */
  handlerOrg?: string;
}

/** 人大代表档案 */
export interface Deputy {
  id: string; // 档案编号，如 DB0001
  name: string;
  gender: '男' | '女';
  birthYear: number;
  political: string; // 政治面貌：中共党员 / 群众 / 民主党派
  sector: string; // 界别：农民 / 工人 / 教师 / 医卫 / 企业 / 社区…
  town: string; // 所属镇（街道）
  level: string; // 层级：如 “镇第七届人大代表”
  termStart: number; // 本届任期起始年份
  consecutive: boolean; // 是否连任
  occupation: string; // 职业及单位
  phone: string;
  email: string;
  address: string;
  joinDate: string; // 当选日期 YYYY-MM-DD
  bio: string; // 个人简介
  /** 履职基础数据：联系群众（选民）次数 */
  contactVoters: number;
}

/** 活动类型：对应乡镇人大三类主要履职活动 + 学习培训 */
export type ActivityType = '调研视察' | '约见镇长' | '代表述职' | '学习培训';

/** 活动状态 */
export type ActivityStatus = '计划中' | '已完成' | '已取消';

/** 履职活动（调研视察 / 约见镇长 / 代表述职等） */
export interface Activity {
  id: string; // 活动编号，如 HD2025-001
  type: ActivityType;
  title: string;
  date: string; // YYYY-MM-DD
  location: string;
  organizer: string; // 组织单位：镇人大主席团 / 代表联络站…
  participantIds: string[]; // 参加代表（Deputy.id）
  status: ActivityStatus;
  summary: string; // 活动纪要
  createdAt: string;
}

/** 提案/建议分类 */
export type ProposalCategory =
  | '城乡建设'
  | '交通出行'
  | '民生保障'
  | '教育医疗'
  | '生态环境'
  | '乡村振兴'
  | '其他';

/**
 * 交办流程状态机（业务核心，详见 PROJECT.md）：
 *   待审核 →(人大办审核交办：指定承办单位/期限)→ 已交办
 *          →(承办单位受理)→ 办理中
 *          →(承办单位登记答复)→ 待转送
 *          →(人大办转送代表)→ 已答复
 *          →(领衔代表满意度评价)→ 满意/基本满意 → 已评价（办结）
 *                                → 不满意 →(人大办退回重办)→ 已退回 →(再次交办)→ 已交办
 */
export type ProposalStatus = '待审核' | '已交办' | '办理中' | '待转送' | '已答复' | '已评价' | '已退回';

/** 满意度评价结果 */
export type Satisfaction = '满意' | '基本满意' | '不满意';

/** 交办流程流转记录（详情抽屉时间线展示） */
export interface FlowRecord {
  time: string;
  actor: string;
  action: string;
  note?: string;
}

/** 代表提案/建议（含交办闭环信息） */
export interface Proposal {
  id: string; // 建议编号，如 JY2025-001
  title: string;
  category: ProposalCategory;
  proposerId: string; // 领衔代表
  cosponsorIds: string[]; // 附议代表
  submittedAt: string;
  content: string; // 案由及建议内容
  status: ProposalStatus;
  /** 以下字段随交办流程推进逐步填写 */
  handlerOrg?: string; // 承办单位
  assignedAt?: string; // 交办时间
  deadline?: string; // 办理期限
  reply?: string; // 答复内容
  repliedAt?: string; // 答复时间
  satisfaction?: Satisfaction; // 满意度评价
  evaluatedAt?: string;
  flow: FlowRecord[]; // 流转记录
}