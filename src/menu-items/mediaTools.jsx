import { ScissorOutlined, EditOutlined, QrcodeOutlined } from '@ant-design/icons';

const icons = { ScissorOutlined, EditOutlined, QrcodeOutlined };

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
    },
    {
      id: 'qr-code-generator',
      title: 'QR Code Generator',
      type: 'item',
      url: '/tools/media/qr-code-generator',
      icon: icons.QrcodeOutlined,
      breadcrumbs: false
    }
  ]
};

export default mediaTools;
