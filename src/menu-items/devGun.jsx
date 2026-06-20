import { ApiOutlined } from '@ant-design/icons';

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
    }
  ]
};

export default devGun;
