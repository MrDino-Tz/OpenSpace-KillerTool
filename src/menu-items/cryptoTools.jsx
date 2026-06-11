import { LockOutlined, KeyOutlined } from '@ant-design/icons';

const icons = {
  LockOutlined,
  KeyOutlined
};

const cryptoTools = {
  id: 'group-crypto-tools',
  title: 'CryptOK',
  type: 'group',
  children: [
    {
      id: 'password-generator',
      title: 'Password Generator',
      type: 'item',
      url: '/tools/crypto/password-generator',
      icon: icons.KeyOutlined,
      breadcrumbs: false
    },
    {
      id: 'password-analyzer',
      title: 'Password Analyzer',
      type: 'item',
      url: '/tools/crypto/password-analyzer',
      icon: icons.LockOutlined,
      breadcrumbs: false
    }
  ]
};

export default cryptoTools;
