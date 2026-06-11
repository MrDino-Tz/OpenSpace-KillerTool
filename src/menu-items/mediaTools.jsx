import { ScissorOutlined, EditOutlined } from '@ant-design/icons';

const icons = { ScissorOutlined, EditOutlined };

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
    },
    {
      id: 'photo-editor',
      title: 'Photo Editor',
      type: 'item',
      url: '/tools/media/photo-editor',
      icon: icons.EditOutlined,
      breadcrumbs: false
    }
  ]
};

export default mediaTools;
