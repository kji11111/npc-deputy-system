import { useState } from 'react';
import { App as AntApp, Avatar, Button, Card, Select, Space, Tabs, Typography } from 'antd';
import { LoginOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/AppStore';
import { HANDLER_ORGS } from '../mocks/proposals';

const { Title, Paragraph, Text } = Typography;

/** mock 登录页：不接真实鉴权，选择角色即进入（演示用）；三种角色：管理员 / 人大代表 / 承办单位 */
export default function Login() {
  const { deputies, login } = useStore();
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [deputyId, setDeputyId] = useState<string | undefined>();
  const [org, setOrg] = useState<string | undefined>();

  const enterAdmin = () => {
    login({ id: 'admin-001', name: '人大办管理员', role: 'admin' });
    message.success('已以管理员身份进入');
    navigate('/dashboard');
  };

  const enterDeputy = () => {
    const d = deputies.find((x) => x.id === deputyId);
    if (!d) {
      message.warning('请先选择一位代表');
      return;
    }
    login({ id: 'user-' + d.id, name: d.name, role: 'deputy', deputyId: d.id });
    message.success('欢迎，' + d.name + ' 代表');
    navigate('/deputies');
  };

  const enterHandler = () => {
    if (!org) {
      message.warning('请先选择本单位');
      return;
    }
    // 承办单位角色：绑定单位名称，只能看到交办给本单位的事项
    login({ id: 'handler-' + org, name: org, role: 'handler', handlerOrg: org });
    message.success('已以承办单位身份进入：' + org);
    navigate('/proposals');
  };

  return (
    <div className="login-bg">
      <Card style={{ width: 430, boxShadow: '0 8px 30px rgba(17,104,95,0.10)' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Avatar size={56} style={{ backgroundColor: '#11685f' }} icon={<UserOutlined />} />
          <Title level={4} style={{ margin: '12px 0 4px' }}>基层人大代表信息管理系统</Title>
          <Text type="secondary">代表档案 · 活动管理 · 提案建议交办闭环</Text>
        </div>
        <Tabs
          centered
          items={[
            {
              key: 'admin',
              label: '管理员',
              children: (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <Paragraph type="secondary">管理员（人大办）拥有全部权限：档案维护、活动组织、建议审核交办与转送。</Paragraph>
                  <Button type="primary" size="large" icon={<LoginOutlined />} onClick={enterAdmin} block>
                    以管理员身份进入
                  </Button>
                </div>
              ),
            },
            {
              key: 'deputy',
              label: '人大代表',
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    代表仅可查看本人档案、活动与提案，并可提交建议、对办理结果作满意度评价。
                  </Paragraph>
                  <Select
                    showSearch
                    placeholder="选择代表身份（演示账号，含新增代表）"
                    style={{ width: '100%' }}
                    value={deputyId}
                    onChange={setDeputyId}
                    options={deputies.map((d) => ({ value: d.id, label: d.name + '（' + d.town + ' · ' + d.sector + '）' }))}
                    optionFilterProp="label"
                  />
                  <Button type="primary" size="large" icon={<LoginOutlined />} onClick={enterDeputy} block>
                    以代表身份进入
                  </Button>
                </Space>
              ),
            },
            {
              key: 'handler',
              label: '承办单位',
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    承办单位仅可办理交办给本单位的事项：登记受理、填写答复并推回人大办。
                  </Paragraph>
                  <Select
                    showSearch
                    placeholder="选择本单位（演示账号）"
                    style={{ width: '100%' }}
                    value={org}
                    onChange={setOrg}
                    options={HANDLER_ORGS.map((o) => ({ value: o, label: o }))}
                    optionFilterProp="label"
                  />
                  <Button type="primary" size="large" icon={<LoginOutlined />} onClick={enterHandler} block>
                    以承办单位身份进入
                  </Button>
                </Space>
              ),
            },
          ]}
        />
        <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0, textAlign: 'center' }}>
          演示系统：数据为固定种子 mock，仅保存在本机浏览器
        </Paragraph>
      </Card>
    </div>
  );
}