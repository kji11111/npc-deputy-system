import type { Activity, Deputy, Proposal } from '../types';

/** 履职画像五维名称 */
export const RADAR_DIMS = ['活动参与', '提案建议', '学习培训', '代表述职', '联系群众'] as const;

/** 五维满分（用于雷达图归一化到 0~100） */
const RADAR_MAX = [20, 15, 10, 10, 50];

export interface DeputyPerformance {
  /** 履职综合积分：活动×2 + 建议×3 + 培训×1 + 述职×5 + 联系群众×0.2 */
  score: number;
  /** 雷达图五维数值（已归一化 0~100） */
  radar: number[];
  activityCount: number;
  proposalCount: number;
}

/**
 * 计算某位代表的履职画像：
 * 从活动表统计参与场次（区分学习培训/代表述职），
 * 从提案表统计领衔 + 附议的建议数。
 */
export function computePerformance(
  deputy: Deputy,
  activities: Activity[],
  proposals: Proposal[],
): DeputyPerformance {
  const mine = activities.filter(
    (a) => a.status !== '已取消' && a.participantIds.includes(deputy.id),
  );
  const activityCount = mine.filter((a) => a.type !== '学习培训').length;
  const trainingCount = mine.filter((a) => a.type === '学习培训').length;
  const dutyReportCount = mine.filter((a) => a.type === '代表述职').length;
  const proposalCount = proposals.filter(
    (p) => p.proposerId === deputy.id || p.cosponsorIds.includes(deputy.id),
  ).length;

  const score = Math.round(
    activityCount * 2 + proposalCount * 3 + trainingCount + dutyReportCount * 5 + deputy.contactVoters * 0.2,
  );

  const radar = [activityCount, proposalCount, trainingCount, dutyReportCount, deputy.contactVoters].map(
    (v, i) => Math.min(100, Math.round((v / RADAR_MAX[i]) * 100)),
  );

  return { score, radar, activityCount, proposalCount };
}