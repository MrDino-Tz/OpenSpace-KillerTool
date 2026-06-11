import { FontSizeOutlined, SmileOutlined } from '@ant-design/icons';

const icons = {
  FontSizeOutlined,
  SmileOutlined
};

const textTools = {
  id: 'group-text-tools',
  title: 'Text Tools',
  type: 'group',
  children: [
    {
      id: 'ascii-generator',
      title: 'ASCII Word Art Generator',
      type: 'item',
      url: '/tools/text/ascii-generator',
      icon: icons.FontSizeOutlined,
      breadcrumbs: false
    },
    {
      id: 'emoji-picker',
      title: 'Emoji Picker',
      type: 'item',
      url: '/tools/text/emoji-picker',
      icon: icons.SmileOutlined,
      breadcrumbs: false
    }
  ]
};

export default textTools;
