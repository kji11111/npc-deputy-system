# 基层人大代表信息管理系统

> 视觉模板参考：[a-share-research](https://hvalo596.github.io/a-share-research/)（浅青绿学术报告风格：主色 `#11685f`、底色 `#f3f6f5`、薄荷底指标块、琥珀提示框、细描边白卡片）。本系统将该设计语言迁移到 Ant Design 5 的后台布局（左侧菜单 + 顶栏 + 主内容）中。

## 一、整体目标

面向乡镇（街道）人大工作人员与基层人大代表，提供一套**单机演示版**的代表履职信息管理系统，覆盖实际工作中的三条主线：

1. **代表档案管理**：代表基本信息、界别、镇街、任期（连任/新任）、履职积分与画像；
2. **活动管理**：调研视察、约见镇长、代表述职三类核心活动的组织、参与与纪要；
3. **提案建议交办**：建议从提交 → 审核交办 → 办理 → 答复 → 满意度评价 / 退回重办的**闭环流转**。

数据全部为演示用 mock（固定随机种子生成），首次访问写入浏览器 localStorage 持久化，顶栏可一键重置。

## 二、角色与权限（简单模拟）

| 角色 | 进入方式 | 可见功能 | 关键操作 |
|---|---|---|---|
| 管理员 | 登录页选“管理员” | 全部页面 | 档案增改、活动增删改、建议交办/受理/答复登记/退回重办、CSV 导出 |
| 人大代表 | 登录页选择代表身份 | 我的档案 / 我的活动 / 我的提案 | 查看个人画像、提交建议、对自己领衔的已答复建议做满意度评价 |

## 三、功能模块

### 1. 登录页（mock）
不接真实鉴权：管理员一键进入；代表从下拉中选择档案后进入（User.deputyId 绑定）。

### 2. 数据仪表盘（仅管理员）
- 统计卡（薄荷底，仿模板 `.cut`）：代表总数 / 近一年活动场次 / 提案建议总数 / 办结率；
- 图表（ECharts）：近 6 个月活动数量（按类型堆叠柱状）、提案分类分布（环形图）、办理状态分布（条形图）、履职积分 Top8（横向条形）。

### 3. 代表档案
- 列表：姓名/编号搜索、界别/镇街/连任筛选、分页、导出 CSV；
- 详情抽屉：基本信息、**履职画像五维雷达图**（活动参与/提案建议/学习培训/代表述职/联系群众）、参加活动、提出建议；
- 管理员可新增 / 编辑档案。

### 4. 活动管理
- 类型：调研视察 / 约见镇长 / 代表述职 / 学习培训；
- 列表：类型/状态/年份筛选、关键词搜索、CSV 导出；
- 管理员 CRUD：新建/编辑（参与代表多选、活动纪要）、删除；所有人可查看详情抽屉。

### 5. 提案建议交办（核心工作流）
状态机（代码同步注释见 `src/types/index.ts`）：

```
代表提交 ──→ 待审核
              │ 管理员“审核交办”（指定承办单位 + 办理期限）
              ▼
            已交办 ──受理──→ 办理中 ──登记答复──→ 已答复
              ▲                                   │ 领衔代表满意度评价
              │ 再次交办                           ├─ 满意 / 基本满意 → 已评价（办结）
              └───────── 已退回 ←──评价“不满意”────┘
```

- 详情抽屉展示完整**流转时间线**（每次状态变更追加 FlowRecord）；
- 代表角色仅能评价**自己领衔**的建议。

## 四、数据 Schema（TypeScript 定义见 `src/types/index.ts`）

### Deputy 代表档案
| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 档案编号 DB0001 |
| name / gender / birthYear | string / ‘男’\|‘女’ / number | 基本信息 |
| political / sector / town | string | 政治面貌 / 界别 / 所属镇街 |
| level / termStart / consecutive | string / number / boolean | 层级、本届起始年、是否连任 |
| occupation / phone / email / address | string | 职业单位与联系方式 |
| joinDate / bio | string | 当选日期、个人简介 |
| contactVoters | number | 联系群众（选民）次数，用于履职画像 |

### Activity 履职活动
| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 编号 HD2025-001 |
| type | ‘调研视察’\|‘约见镇长’\|‘代表述职’\|‘学习培训’ | 活动类型 |
| title / date / location / organizer | string | 主题、日期、地点、组织单位 |
| participantIds | string[] | 参加代表（Deputy.id） |
| status | ‘计划中’\|‘已完成’\|‘已取消’ | 状态 |
| summary / createdAt | string | 活动纪要、创建时间 |

### Proposal 提案/建议
| 字段 | 类型 | 说明 |
|---|---|---|
| id / title / category | string / string / ProposalCategory | 编号 JY2025-001、标题、分类 |
| proposerId / cosponsorIds | string / string[] | 领衔代表 / 附议代表 |
| submittedAt / content | string | 提交时间、案由与建议内容 |
| status | ProposalStatus | 待审核/已交办/办理中/已答复/已评价/已退回 |
| handlerOrg / assignedAt / deadline | string? | 承办单位、交办时间、办理期限 |
| reply / repliedAt | string? | 答复内容与时间 |
| satisfaction / evaluatedAt | ‘满意’\|‘基本满意’\|‘不满意’? | 满意度评价 |
| flow | FlowRecord[] | 流转记录（time/actor/action/note） |

### User 登录用户
`{ id, name, role: 'admin' | 'deputy', deputyId? }`

### 履职积分（`src/utils/performance.ts`）
`积分 = 活动参与×2 + 提案建议×3 + 学习培训×1 + 代表述职×5 + 联系群众×0.2`；
雷达图五维按满分 `[20, 15, 10, 10, 50]` 归一化为 0~100。

## 五、目录结构

```
src/
├─ main.tsx            # 入口：中文语言包 + 主题 + Provider
├─ App.tsx             # 路由与登录守卫
├─ theme.ts            # AntD 主题 token（对齐参考模板配色）
├─ index.css           # 全局样式（指标块/登录页背景等）
├─ types/index.ts      # 全部数据类型与交办状态机注释
├─ mocks/              # 固定种子 mock 数据（代表/活动/提案）
├─ store/AppStore.tsx  # 全局状态 + localStorage 持久化 + 工作流动作
├─ utils/              # csv.ts 导出、performance.ts 履职画像
├─ components/         # EChart.tsx 图表封装、StatCard.tsx 指标块
├─ layouts/AdminLayout.tsx
└─ pages/              # Login / Dashboard / Deputies / Activities / Proposals
```

## 六、启动与部署

```bash
npm install
npm run dev        # http://localhost:5173/npc-deputy-system/
npm run build      # tsc 类型检查 + 打包到 dist/
```

GitHub Pages：`vite.config.ts` 已设 `base: '/npc-deputy-system/'`，将 `dist/` 发布到同名仓库即可；路由使用 HashRouter，Pages 上刷新不会 404。

## 七、边界说明（对齐参考模板的“数据边界”审计风格）
- 所有数据为**演示 mock**，不代表任何真实人员与事项；
- 无真实后端与鉴权，登录仅为角色演示；
- localStorage 仅保存在本机浏览器，顶栏“重置演示数据”或清空站点数据即可恢复初始状态。