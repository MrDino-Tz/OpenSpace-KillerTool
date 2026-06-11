import { SwapOutlined, CodeOutlined, CalculatorOutlined, RetweetOutlined, AppstoreOutlined } from '@ant-design/icons';

const icons = {
  SwapOutlined,
  CodeOutlined,
  CalculatorOutlined,
  RetweetOutlined,
  AppstoreOutlined
};

const conversionTools = {
  id: 'group-conversion-tools',
  title: 'Conversion Tools',
  type: 'group',
  children: [
    {
      id: 'encoders-decoders',
      title: 'Encoders/Decoders',
      type: 'item',
      url: '/tools/conversion/encoders-decoders',
      icon: icons.SwapOutlined,
      breadcrumbs: false
    },
    {
      id: 'code-converters',
      title: 'Code Converters',
      type: 'item',
      url: '/tools/conversion/code-converters',
      icon: icons.CodeOutlined,
      breadcrumbs: false
    },
    {
      id: 'math-logic',
      title: 'Math / Logic',
      type: 'item',
      url: '/tools/conversion/math-logic',
      icon: icons.CalculatorOutlined,
      breadcrumbs: false
    },
    {
      id: 'text-case-converters',
      title: 'Text & Case Converters',
      type: 'item',
      url: '/tools/conversion/text-case-converters',
      icon: icons.RetweetOutlined,
      breadcrumbs: false
    },
    {
      id: 'other-converters',
      title: 'Other Converters',
      type: 'item',
      url: '/tools/conversion/other-converters',
      icon: icons.AppstoreOutlined,
      breadcrumbs: false
    }
  ]
};

export default conversionTools;
