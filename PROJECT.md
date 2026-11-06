# 基层人大代表信息管理系统

> 视觉模板参考：[a-share-research](https://hvalo596.github.io/a-share-research/)（浅青绿学术报告风格：主色 `#11685f`、底色 `#f3f6f5`、薄荷底指标块、琥珀提示框、细描边白卡片）。本系统将该设计语言迁移到 Ant Design 5 的后台布局（左侧菜单 + 顶栏 + 主内容）中。

## 一、整体目标

面向乡镇（街道）人大工作人员、承办单位与基层人大代表，提供一套**单机演示版**的代表履职信息管理系统，覆盖实际工作中的三条主线：

1. **代表档案管理**：代表基本信息、界别、镇街、任期（连任/新任）、履职积分与画像；
2. **活动管理**：调研视察、约见镇长、代表述职三类核心活动的组织、参与与纪要；
3. **提案建议交办**：建议从提交 → 审核交办 → 承办单位受理 → 办理答复 → 人大办转送代表 → 满意度评价 / 退回重办的**闭环流转**。

数据全部为演示用 mock（固定随机种子生成），首次访问写入浏览器 localStorage 持久化，顶栏可一键重置。

## 二、角色与权限（简单模拟）

| 角色 | 进入方式 | 可见功能 | 关键操作 |
|---|---|---|---|
| 管理员（人大办） | 登录页选“管理员” | 全部页面 | 档案增删改、活动增删改、建议**审核交办 / 转送代表 / 再次交办**、CSV 导出 |
| 人大代表 | 登录页选择代表身份 | 我的档案 / 我的活动 / 我的提案 | 查看个人画像、提交建议、对**本人领衔**的已答复建议做满意度评价 |
| 承办单位 | 登录页选“承办单位”并选单位 | 仅“提案办理”（交办给本单位的事项） | **受理**（已交办→办理中）、**登记答复**（办理中→待转送，推回人大办） |

顶栏提供「**我的待办**」Badge：
- 管理员 = 待审核 + 待转送 + 已退回；
- 承办单位 = 已交办 + 办理中（限本单位）；
- 代表 = 已答复且本人领衔、尚未评价。

点击待办跳转到提案列表并自动按对应状态筛选（`?todo=1`）。

## 三、功能模块

### 1. 登录页（mock）
不接真实鉴权，三个标签页：管理员一键进入；代表从下拉中选择档案后进入（`User.deputyId` 绑定）；承办单位从下拉中选择单位后进入（`User.handlerOrg` 绑定）。

### 2. 数据仪表盘（仅管理员）
- 统计卡（薄荷底，仿模板 `.cut`）：代表总数 / 近一年活动场次 / 提案建议总数 / 办结率；
- 图表（ECharts）：近 6 个月活动数量（按类型堆叠柱状）、提案分类分布（环形图）、办理状态分布（条形图，含“待转送”）、履职积分 Top8（横向条形）。

### 3. 代表档案
- 页头醒目主按钮「新增代表档案」+ 筛选栏保留「新增代表」按钮；
- 列表：姓名/编号搜索、界别/镇街/连任筛选、分页、导出 CSV、删除（Popconfirm 确认，仅移除档案、保留历史记录）；
- 详情抽屉：基本信息、**履职画像五维雷达图**（活动参与/提案建议/学习培训/代表述职/联系群众）、参加活动、提出建议；
- 新增/编辑表单：「界别」「所属镇街」为可搜索、**可输入新值**（AutoComplete），不受 mock 既有值限制；
- 新增成功后提示：退出后可在登录页用该代表身份进入（登录页下拉来自 store，动态更新）。

### 4. 活动管理
- 类型：调研视察 / 约见镇长 / 代表述职 / 学习培训；
- 列表：类型/状态/年份筛选、关键词搜索、CSV 导出；
- 管理员 CRUD：新建/编辑（参与代表多选、活动纪要）、删除；所有人可查看详情抽屉。

### 5. 提案建议交办（核心工作流）
状态机（代码同步注释见 `src/types/index.ts`）：

```
待审核 --人大办审核交办--> 已交办 --承办单位受理--> 办理中
       --承办单位登记答复--> 待转送 --人大办转送代表--> 已答复
       --领衔代表评价--> 满意/基本满意 → 已评价（办结）
                      └→ 不满意 → 已退回 --人大办再次交办--> 已交办
```

角色分工（按钮按角色与状态显示）：
- **人大办（管理员）**：待审核→审核交办；待转送→转送代表；已退回→再次交办；
- **承办单位**：已交办→受理；办理中→登记答复（填写答复内容后推回人大办）；
- **领衔代表**：已答复→满意度评价。

流转时间线文案体现“谁推给谁”，例如：
- 「镇村镇建设服务中心受理」（承办单位点受理）
- 「承办单位提交答复，已推回人大办」（承办单位提交答复，进入待转送）
- 「人大办已转送领衔代表，请评价」（管理员转送，进入已答复）
- 「满意度评价：满意，办结」/「满意度评价：不满意，退回重办」

### 6. 我的待办（顶栏 Badge）
按角色统计待办数量（见上），点击跳转提案列表并自动筛选。

## 四、数据 Schema（TypeScript 定义见 `src/types/index.ts`）

### Deputy 代表档案
| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 档案编号 DB0001 |
| name / gender / birthYear | string / ‘男’\|‘女’ / number | 基本信息 |
| political / sector / town | string | 政治面貌 / 界别（可自定义新值） / 所属镇街（可自定义新值） |
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
| status | ProposalStatus | 待审核/已交办/办理中/**待转送**/已答复/已评价/已退回 |
| handlerOrg / assignedAt / deadline | string? | 承办单位、交办时间、办理期限 |
| reply / repliedAt | string? | 答复内容与时间（答复提交即“待转送”） |
| satisfaction / evaluatedAt | ‘满意’\|‘基本满意’\|‘不满意’? | 满意度评价 |
| flow | FlowRecord[] | 流转记录（time/actor/action/note） |

### User 登录用户
`{ id, name, role: 'admin' | 'deputy' | 'handler', deputyId?, handlerOrg? }`
- 代表角色：`deputyId` 绑定档案；
- 承办单位角色：`handlerOrg` 绑定单位名称（与提案 `handlerOrg` 对应）。

### 履职积分（`src/utils/performance.ts`）
`积分 = 活动参与×2 + 提案建议×3 + 学习培训×1 + 代表述职×5 + 联系群众×0.2`；
雷达图五维按满分 `[20, 15, 10, 10, 50]` 归一化为 0~100。

## 五、目录结构

```
src/
├─ main.tsx            # 入口：中文语言包 + 主题 + Provider
├─ App.tsx             # 路由与登录守卫（含承办单位角色限制）
├─ theme.ts            # AntD 主题 token（对齐参考模板配色）
├─ index.css           # 全局样式（指标块/登录页背景等）
├─ types/index.ts      # 全部数据类型与交办状态机注释
├─ mocks/              # 固定种子 mock 数据（代表/活动/提案）
├─ store/AppStore.tsx  # 全局状态 + localStorage 持久化 + 工作流动作
├─ utils/              # csv.ts 导出、performance.ts 履职画像
├─ components/         # EChart.tsx 图表封装、StatCard.tsx 指标块
├─ layouts/AdminLayout.tsx  # 含“我的待办”Badge 与按角色过滤的菜单
└─ pages/              # Login / Dashboard / Deputies / Activities / Proposals
```

## 六、启动与部署

```bash
npm install
npm run dev        # http://localhost:5173/npc-deputy-system/
npm run build      # tsc 类型检查 + 打包到 dist/
```

GitHub Pages：`.github/workflows/deploy.yml` 自动部署（checkout → setup-node → npm ci → build → deploy-pages），`base: '/npc-deputy-system/'` 与仓库名一致；路由使用 HashRouter，刷新不会 404。详见 README.md。

## 七、演示数据说明
- mock 覆盖全部 7 种交办状态；生成的前 3 件固定交办给「镇村镇建设服务中心」，保证以该单位登录即可演示“受理/登记答复”；
- 若浏览器里存有旧版本数据，点顶栏「重置演示数据」即可获得含“待转送”的新状态分布。

## 八、边界说明（对齐参考模板的“数据边界”审计风格）
- 所有数据为**演示 mock**，不代表任何真实人员与事项；
- 无真实后端与鉴权，登录仅为角色演示；
- localStorage 仅保存在本机浏览器，顶栏“重置演示数据”或清空站点数据即可恢复初始状态。