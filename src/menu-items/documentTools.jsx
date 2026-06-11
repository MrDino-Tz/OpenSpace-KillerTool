import { FilePdfOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const icons = {
  FilePdfOutlined,
  SafetyCertificateOutlined
};

const documentTools = {
  id: 'group-document-tools',
  title: 'Document Tools',
  type: 'group',
  children: [
    {
      id: 'pdf-signature-checker',
      title: 'PDF Signature Checker',
      type: 'item',
      url: '/tools/document/pdf-signature-checker',
      icon: icons.SafetyCertificateOutlined,
      breadcrumbs: false
    }
  ]
};

export default documentTools;
