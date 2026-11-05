import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import 'antd/dist/reset.css';
import './index.css';
import theme from './theme';
import App from './App';
import { AppStoreProvider } from './store/AppStore';

// 应用入口：中文语言包 + 对齐参考模板的主题 + 全局状态 Provider
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={theme}>
      <AntApp>
        <AppStoreProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </AppStoreProvider>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);