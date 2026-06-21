import { ApiOutlined, AuditOutlined, FileTextOutlined } from '@ant-design/icons';

const devGun = {
  id: 'group-dev-gun',
  title: 'Dev Gun',
  type: 'group',
  children: [
    {
      id: 'pigeon-api',
      title: 'Pigeon API',
      type: 'item',
      url: '/tools/dev-gun/pigeon-api',
      icon: ApiOutlined,
      breadcrumbs: false
    },
    {
      id: 'regex-tester',
      title: 'Regex Tester',
      type: 'item',
      url: '/tools/dev-gun/regex-tester',
      icon: AuditOutlined,
      breadcrumbs: false
    },
    {
      id: 'file-meta-reader',
      title: 'File Meta Reader',
      type: 'item',
      url: '/tools/dev-gun/file-meta-reader',
      icon: FileTextOutlined,
      breadcrumbs: false
    }
  ]
};

export default devGun;
