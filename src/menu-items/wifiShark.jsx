import { ScanOutlined, QrcodeOutlined, LaptopOutlined, CalculatorOutlined, KeyOutlined, SafetyCertificateOutlined, LineChartOutlined, NumberOutlined } from '@ant-design/icons';

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
    },
    {
      id: 'wifi-qr-generator',
      title: 'WiFi QR Generator',
      type: 'item',
      url: '/tools/wifi-shark/qr-generator',
      icon: QrcodeOutlined,
      breadcrumbs: false
    },
    {
      id: 'mac-lookup',
      title: 'MAC Address Lookup',
      type: 'item',
      url: '/tools/wifi-shark/mac-lookup',
      icon: LaptopOutlined,
      breadcrumbs: false
    },
    {
      id: 'subnet-calculator',
      title: 'Subnet Calculator',
      type: 'item',
      url: '/tools/wifi-shark/subnet-calculator',
      icon: CalculatorOutlined,
      breadcrumbs: false
    },
    {
      id: 'wifi-password-generator',
      title: 'WiFi Password Generator',
      type: 'item',
      url: '/tools/wifi-shark/wifi-password-generator',
      icon: KeyOutlined,
      breadcrumbs: false
    },
    {
      id: 'default-router-passwords',
      title: 'Default Router Passwords',
      type: 'item',
      url: '/tools/wifi-shark/default-router-passwords',
      icon: SafetyCertificateOutlined,
      breadcrumbs: false
    },
    {
      id: 'speed-test-history',
      title: 'Speed Test History',
      type: 'item',
      url: '/tools/wifi-shark/speed-test-history',
      icon: LineChartOutlined,
      breadcrumbs: false
    },
    {
      id: 'port-lookup',
      title: 'Port Number Lookup',
      type: 'item',
      url: '/tools/wifi-shark/port-lookup',
      icon: NumberOutlined,
      breadcrumbs: false
    }
  ]
};

export default wifiShark;
