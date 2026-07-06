import { ScanOutlined } from '@ant-design/icons';

const wifiShark = {
  id: 'group-wifi-shark',
  title: 'WiFi Shark',
  type: 'group',
  children: [
    {
      id: 'wifi-qr-decoder',
      title: 'WiFi QR Decoder',
      type: 'item',
      url: '/tools/wifi-shark/qr-decoder',
      icon: ScanOutlined,
      breadcrumbs: false
    }
  ]
};

export default wifiShark;
