import { LockOutlined, KeyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const icons = {
  LockOutlined,
  KeyOutlined,
  SafetyCertificateOutlined
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
    },
    {
      id: 'pdf-signature-checker',
      title: 'PDF Signature Checker',
      type: 'item',
      url: '/tools/crypto/pdf-signature-checker',
      icon: icons.SafetyCertificateOutlined,
      breadcrumbs: false
    }
  ]
};

export default cryptoTools;
