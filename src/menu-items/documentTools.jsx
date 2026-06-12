import { FilePdfOutlined } from '@ant-design/icons';

const icons = { FilePdfOutlined };

const documentTools = {
  id: 'group-document-tools',
  title: 'OpenDoc',
  type: 'group',
  children: [
    {
      id: 'pdf-editor',
      title: 'PDF Editor',
      type: 'item',
      url: '/tools/document/pdf-editor',
      icon: icons.FilePdfOutlined,
      breadcrumbs: false
    }
  ]
};

export default documentTools;
