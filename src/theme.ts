import type { ThemeConfig } from 'antd';

/**
 * 主题配置：视觉基调对齐参考模板（a-share-research 可视化）
 * - 页面底色 #f3f6f5（浅灰绿）/ 主色 #11685f（青绿）
 * - 表头、指标块用薄荷底 #eaf2ef；琥珀提示 #d6a044 在页面中以 Alert 呈现
 */
const theme: ThemeConfig = {
  token: {
    colorPrimary: '#11685f',
    colorInfo: '#11685f',
    colorLink: '#11685f',
    colorBgLayout: '#f3f6f5',
    colorBorderSecondary: '#e0e9e6',
    borderRadius: 10,
    fontFamily: "system-ui, 'Microsoft YaHei', sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: { headerBg: '#ffffff', headerHeight: 56, siderBg: '#ffffff' },
    Menu: { itemSelectedBg: '#eaf2ef', itemSelectedColor: '#11685f' },
    Table: { headerBg: '#eaf2ef', headerColor: '#203837' },
    Statistic: { contentFontSize: 22 },
  },
};

export default theme;