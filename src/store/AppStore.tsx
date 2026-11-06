import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import type { Activity, Deputy, Proposal, Satisfaction, User } from '../types';
import { mockDeputies } from '../mocks/deputies';
import { mockActivities } from '../mocks/activities';
import { mockProposals } from '../mocks/proposals';

/** localStorage 键：演示数据与登录用户（顶栏“重置演示数据”或清站点数据即可恢复初始 mock） */
const DB_KEY = 'npc-deputy-db-v1';
const USER_KEY = 'npc-deputy-user-v1';

interface DbData {
  deputies: Deputy[];
  activities: Activity[];
  proposals: Proposal[];
}

const now = () => dayjs().format('YYYY-MM-DD HH:mm');

/** 首次访问用 mock 初始化并写入 localStorage，之后读写均走本地存储 */
function loadDb(): DbData {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as DbData;
  } catch {
    // 数据损坏时重建
  }
  const fresh: DbData = { deputies: mockDeputies, activities: mockActivities, proposals: mockProposals };
  localStorage.setItem(DB_KEY, JSON.stringify(fresh));
  return fresh;
}

/** 不可变更新提案列表的小工具 */
function patchProposal(proposals: Proposal[], id: string, patch: (p: Proposal) => Proposal): Proposal[] {
  return proposals.map((p) => (p.id === id ? patch(p) : p));
}

/**
 * 全局状态与业务动作。
 * 提案建议交办工作流（每次状态变更都会追加一条 FlowRecord 流转记录，文案体现“谁推给谁”）：
 *   待审核 --assignProposal(人大办审核交办：承办单位+期限)--> 已交办
 *          --acceptProposal(承办单位受理)--> 办理中
 *          --replyProposal(承办单位登记答复，推回人大办)--> 待转送
 *          --transferProposal(人大办转送领衔代表)--> 已答复
 *          --evaluateProposal(领衔代表满意度评价)--> 满意/基本满意 → 已评价（办结）
 *                                                  → 不满意 → 已退回 --再次交办--> 已交办
 */
export interface Store {
  user: User | null;
  deputies: Deputy[];
  activities: Activity[];
  proposals: Proposal[];
  login: (user: User) => void;
  logout: () => void;
  resetData: () => void;
  saveDeputy: (deputy: Deputy) => void;
  /** 删除代表档案（仅从档案列表移除，其历史活动/建议记录保留） */
  removeDeputy: (id: string) => void;
  saveActivity: (activity: Activity) => void;
  removeActivity: (id: string) => void;
  addProposal: (draft: Omit<Proposal, 'id' | 'flow' | 'status'>, actorName: string) => void;
  /** 管理员：审核交办 / 退回件再次交办 */
  assignProposal: (id: string, org: string, deadline: string, actor: string) => void;
  /** 承办单位：登记受理（已交办 → 办理中），actor 为单位名称 */
  acceptProposal: (id: string, actor: string) => void;
  /** 承办单位：登记答复（办理中 → 待转送），部门办完推回人大办 */
  replyProposal: (id: string, reply: string, actor: string) => void;
  /** 管理员：转送代表（待转送 → 已答复） */
  transferProposal: (id: string, actor: string) => void;
  /** 领衔代表：满意度评价（不满意 → 退回重办） */
  evaluateProposal: (id: string, satisfaction: Satisfaction, actor: string) => void;
}

const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore 必须在 AppStoreProvider 内使用');
  return store;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DbData>(loadDb);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }, [db]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const login = useCallback((u: User) => setUser(u), []);
  const logout = useCallback(() => setUser(null), []);
  const resetData = useCallback(() => {
    localStorage.removeItem(DB_KEY);
    setDb(loadDb());
  }, []);

  const saveDeputy = useCallback((deputy: Deputy) => {
    setDb((prev) => ({
      ...prev,
      deputies: prev.deputies.some((d) => d.id === deputy.id)
        ? prev.deputies.map((d) => (d.id === deputy.id ? deputy : d))
        : [...prev.deputies, deputy],
    }));
  }, []);

  const removeDeputy = useCallback((id: string) => {
    setDb((prev) => ({ ...prev, deputies: prev.deputies.filter((d) => d.id !== id) }));
  }, []);

  const saveActivity = useCallback((activity: Activity) => {
    setDb((prev) => ({
      ...prev,
      activities: prev.activities.some((a) => a.id === activity.id)
        ? prev.activities.map((a) => (a.id === activity.id ? activity : a))
        : [activity, ...prev.activities],
    }));
  }, []);

  const removeActivity = useCallback((id: string) => {
    setDb((prev) => ({ ...prev, activities: prev.activities.filter((a) => a.id !== id) }));
  }, []);

  /** 新提交的建议一律从“待审核”起步，编号在当年最大号上自增，并写入第一条流转记录 */
  const addProposal = useCallback((draft: Omit<Proposal, 'id' | 'flow' | 'status'>, actorName: string) => {
    setDb((prev) => {
      const y = dayjs().year();
      let max = 0;
      prev.proposals.forEach((p) => {
        const m = p.id.match(new RegExp('^JY' + y + '-(\\d+)$'));
        if (m) max = Math.max(max, parseInt(m[1], 10));
      });
      const id = 'JY' + y + '-' + String(max + 1).padStart(3, '0');
      return {
        ...prev,
        proposals: [{ ...draft, id, status: '待审核', flow: [{ time: now(), actor: actorName, action: '提交建议' }] }, ...prev.proposals],
      };
    });
  }, []);

  /** 管理员：审核交办（或退回件再次交办，会清空上一轮答复/评价） */
  const assignProposal = useCallback((id: string, org: string, deadline: string, actor: string) => {
    setDb((prev) => ({
      ...prev,
      proposals: patchProposal(prev.proposals, id, (p) => ({
        ...p,
        status: '已交办',
        handlerOrg: org,
        assignedAt: now(),
        deadline,
        reply: undefined,
        repliedAt: undefined,
        satisfaction: undefined,
        evaluatedAt: undefined,
        flow: [...p.flow, { time: now(), actor, action: '审核通过并交办至' + org, note: '办理期限：' + deadline }],
      })),
    }));
  }, []);

  /** 承办单位：登记受理（已交办 → 办理中），时间线记录“XX受理” */
  const acceptProposal = useCallback((id: string, actor: string) => {
    setDb((prev) => ({
      ...prev,
      proposals: patchProposal(prev.proposals, id, (p) => ({
        ...p,
        status: '办理中',
        flow: [...p.flow, { time: now(), actor, action: actor + '受理' }],
      })),
    }));
  }, []);

  /** 承办单位：登记答复（办理中 → 待转送），部门办完推回人大办 */
  const replyProposal = useCallback((id: string, reply: string, actor: string) => {
    setDb((prev) => ({
      ...prev,
      proposals: patchProposal(prev.proposals, id, (p) => ({
        ...p,
        status: '待转送',
        reply,
        repliedAt: now(),
        flow: [...p.flow, { time: now(), actor, action: '承办单位提交答复，已推回人大办' }],
      })),
    }));
  }, []);

  /** 管理员：转送代表（待转送 → 已答复），请领衔代表评价 */
  const transferProposal = useCallback((id: string, actor: string) => {
    setDb((prev) => ({
      ...prev,
      proposals: patchProposal(prev.proposals, id, (p) => ({
        ...p,
        status: '已答复',
        flow: [...p.flow, { time: now(), actor, action: '人大办已转送领衔代表，请评价' }],
      })),
    }));
  }, []);

  /** 领衔代表：满意度评价；评价“不满意”直接进入已退回，等待管理员再次交办 */
  const evaluateProposal = useCallback((id: string, satisfaction: Satisfaction, actor: string) => {
    setDb((prev) => ({
      ...prev,
      proposals: patchProposal(prev.proposals, id, (p) => {
        const bad = satisfaction === '不满意';
        const record = bad
          ? { time: now(), actor, action: '满意度评价：不满意，退回重办', note: '请承办单位补充具体措施后重新办理' }
          : { time: now(), actor, action: '满意度评价：' + satisfaction + '，办结' };
        return {
          ...p,
          status: bad ? '已退回' : '已评价',
          satisfaction,
          evaluatedAt: now(),
          flow: [...p.flow, record],
        };
      }),
    }));
  }, []);

  const value = useMemo<Store>(
    () => ({
      user,
      deputies: db.deputies,
      activities: db.activities,
      proposals: db.proposals,
      login,
      logout,
      resetData,
      saveDeputy,
      removeDeputy,
      saveActivity,
      removeActivity,
      addProposal,
      assignProposal,
      acceptProposal,
      replyProposal,
      transferProposal,
      evaluateProposal,
    }),
    [user, db, login, logout, resetData, saveDeputy, removeDeputy, saveActivity, removeActivity, addProposal, assignProposal, acceptProposal, replyProposal, transferProposal, evaluateProposal],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}