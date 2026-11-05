import type { Deputy } from '../types';
import { createRng, pick } from './rng';

/** 基础代表档案（手写 10 条，覆盖不同界别/镇街/性别/连任情况） */
const seeds: Deputy[] = [
  { id: 'DB0001', name: '张建国', gender: '男', birthYear: 1968, political: '中共党员', sector: '农民', town: '城关镇', level: '镇第七届人大代表', termStart: 2021, consecutive: true, occupation: '向阳村种粮大户', phone: '138****1234', email: 'zjg@example.com', address: '城关镇向阳村二组', joinDate: '2021-03-18', bio: '扎根农村三十余年，带头发展优质稻种植，长期关注农田水利与惠农政策落实。', contactVoters: 46 },
  { id: 'DB0002', name: '李秀兰', gender: '女', birthYear: 1975, political: '中共党员', sector: '社区工作者', town: '清河街道', level: '镇第七届人大代表', termStart: 2021, consecutive: true, occupation: '清河街道幸福社区网格员', phone: '139****2345', email: 'lxl@example.com', address: '清河街道幸福社区', joinDate: '2021-03-18', bio: '从事社区工作十五年，熟悉网格化管理，关注养老助餐与老旧小区改造。', contactVoters: 52 },
  { id: 'DB0003', name: '王守田', gender: '男', birthYear: 1962, political: '群众', sector: '农民', town: '柳河镇', level: '镇第七届人大代表', termStart: 2021, consecutive: true, occupation: '柳河镇果树种植户', phone: '137****3456', email: 'wst@example.com', address: '柳河镇柳河村', joinDate: '2021-03-20', bio: '果农出身，多次就农产品销路和农村道路问题提出建议。', contactVoters: 38 },
  { id: 'DB0004', name: '陈雨薇', gender: '女', birthYear: 1988, political: '中共党员', sector: '教师', town: '城关镇', level: '镇第七届人大代表', termStart: 2021, consecutive: false, occupation: '镇中心小学语文教师', phone: '136****4567', email: 'cyw@example.com', address: '城关镇育才路', joinDate: '2024-03-15', bio: '青年教师，关注校园安全、课后托管与留守儿童教育问题。', contactVoters: 25 },
  { id: 'DB0005', name: '刘志强', gender: '男', birthYear: 1979, political: '中共党员', sector: '工人', town: '石桥镇', level: '镇第七届人大代表', termStart: 2021, consecutive: true, occupation: '镇机械厂钳工班组长', phone: '135****5678', email: 'lzq@example.com', address: '石桥镇桥南街', joinDate: '2021-03-20', bio: '一线技术工人，关注职业技能培训与企业用工环境改善。', contactVoters: 30 },
  { id: 'DB0006', name: '赵春梅', gender: '女', birthYear: 1983, political: '群众', sector: '医卫', town: '白马镇', level: '镇第七届人大代表', termStart: 2024, consecutive: false, occupation: '白马镇卫生院全科医生', phone: '134****6789', email: 'zcm@example.com', address: '白马镇白马街', joinDate: '2024-03-15', bio: '基层医生，长期关注村卫生室药品保障与慢性病随访管理。', contactVoters: 28 },
  { id: 'DB0007', name: '孙德海', gender: '男', birthYear: 1970, political: '中共党员', sector: '企业', town: '城关镇', level: '镇第七届人大代表', termStart: 2021, consecutive: true, occupation: '海达食品有限公司负责人', phone: '133****7890', email: 'sdh@example.com', address: '城关镇工业园区', joinDate: '2021-03-18', bio: '本土企业家，关心营商环境与园区配套基础设施建设。', contactVoters: 33 },
  { id: 'DB0008', name: '周文静', gender: '女', birthYear: 1992, political: '群众', sector: '个体经营', town: '柳河镇', level: '镇第七届人大代表', termStart: 2024, consecutive: false, occupation: '柳河镇农资经营户', phone: '132****8901', email: 'zwj@example.com', address: '柳河镇集贸市场', joinDate: '2024-03-15', bio: '年轻个体户，关注集贸市场规范管理与电商助农。', contactVoters: 18 },
  { id: 'DB0009', name: '吴国栋', gender: '男', birthYear: 1965, political: '民主党派', sector: '教师', town: '白马镇', level: '镇第七届人大代表', termStart: 2021, consecutive: true, occupation: '白马中学一级教师', phone: '131****9012', email: 'wgd@example.com', address: '白马镇文化路', joinDate: '2021-03-20', bio: '从教三十余年，关注义务教育均衡发展与校园周边交通安全。', contactVoters: 35 },
  { id: 'DB0010', name: '郑晓燕', gender: '女', birthYear: 1986, political: '中共党员', sector: '社区工作者', town: '清河街道', level: '镇第七届人大代表', termStart: 2024, consecutive: false, occupation: '清河街道朝阳社区党支部书记', phone: '130****0123', email: 'zxy@example.com', address: '清河街道朝阳社区', joinDate: '2024-03-15', bio: '社区书记，关注垃圾分类、停车位管理与社区养老。', contactVoters: 27 },
];

/** 程序化补齐 14 条：固定种子随机生成，保证列表筛选/分页演示效果且数据稳定 */
const genNames = ['冯建军', '蒋丽华', '韩明磊', '曹淑芬', '谢天佑', '杜鹏飞', '彭雅琴', '董春生', '袁月华', '蔡启明', '余桂香', '杜文博', '姚立群', '贺静怡'];
const sectors = ['农民', '工人', '教师', '医卫', '企业', '社区工作者', '个体经营'];
const towns = ['城关镇', '柳河镇', '白马镇', '清河街道', '石桥镇'];
const politicals = ['中共党员', '群众', '民主党派'];
const occupations: Record<string, string[]> = {
  农民: ['蔬菜种植大户', '养殖场经营者', '村两委委员'],
  工人: ['纺织公司挡车工', '建材厂电焊工'],
  教师: ['镇中心小学数学教师', '幼儿园园长'],
  医卫: ['村卫生室村医', '镇卫生院护士'],
  企业: ['服装公司经理', '农产品加工厂厂长'],
  社区工作者: ['社区网格员', '社区居委会委员'],
  个体经营: ['集贸市场商户', '家电维修店主'],
};
const focusBySector: Record<string, string> = {
  农民: '高标准农田与农产品销路',
  工人: '技能培训与劳动保障',
  教师: '校园安全与课后服务',
  医卫: '基层药品保障与慢病管理',
  企业: '营商环境与用工招工',
  社区工作者: '社区治理与养老服务',
  个体经营: '市场管理与商户诉求',
};

const rng = createRng(20250301);
const generated: Deputy[] = genNames.map((name, i) => {
  const sector = pick(rng, sectors);
  const town = pick(rng, towns);
  const consecutive = rng() > 0.55;
  const termStart = consecutive ? 2021 : 2024;
  const gender: Deputy['gender'] = i % 3 === 1 ? '女' : '男';
  const day = String(10 + Math.floor(rng() * 10)).padStart(2, '0');
  return {
    id: 'DB' + String(i + 11).padStart(4, '0'),
    name,
    gender,
    birthYear: 1963 + Math.floor(rng() * 32),
    political: pick(rng, politicals),
    sector,
    town,
    level: '镇第七届人大代表',
    termStart,
    consecutive,
    occupation: pick(rng, occupations[sector]),
    phone: '13' + Math.floor(rng() * 10) + '****' + String(1000 + Math.floor(rng() * 9000)),
    email: 'dy' + String(i + 11).padStart(4, '0') + '@example.com',
    address: town + pick(rng, ['中心街', '文化路', '振兴路', '幸福路']) + (1 + Math.floor(rng() * 120)) + '号',
    joinDate: termStart + '-03-' + day,
    bio: sector + '界代表，来自' + town + '，重点关注' + focusBySector[sector] + '。',
    contactVoters: 12 + Math.floor(rng() * 40),
  };
});

export const mockDeputies: Deputy[] = [...seeds, ...generated];