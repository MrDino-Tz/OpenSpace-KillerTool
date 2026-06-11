import { ScissorOutlined } from '@ant-design/icons';

const icons = { ScissorOutlined };

const mediaTools = {
  id: 'group-media-tools',
  title: 'Image/Video',
  type: 'group',
  children: [
    {
      id: 'image-resizer',
      title: 'Image Resizer',
      type: 'item',
      url: '/tools/media/image-resizer',
      icon: icons.ScissorOutlined,
      breadcrumbs: false
    }
  ]
};

export default mediaTools;
