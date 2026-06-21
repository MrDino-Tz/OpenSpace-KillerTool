import { SwapOutlined, CodeOutlined, CalculatorOutlined, RetweetOutlined, AppstoreOutlined, FieldBinaryOutlined, FileMarkdownOutlined, BgColorsOutlined } from '@ant-design/icons';

const icons = {
  SwapOutlined,
  CodeOutlined,
  CalculatorOutlined,
  RetweetOutlined,
  AppstoreOutlined,
  FieldBinaryOutlined,
  FileMarkdownOutlined,
  BgColorsOutlined
};

const conversionTools = {
  id: 'group-conversion-tools',
  title: 'Conversion Tools',
  type: 'group',
  children: [
    {
      id: 'text-to-binary',
      title: 'Text to ASCII Binary',
      type: 'item',
      url: '/tools/conversion/text-to-binary',
      icon: icons.FieldBinaryOutlined,
      breadcrumbs: false
    },
    {
      id: 'markdown-to-html',
      title: 'Markdown to HTML',
      type: 'item',
      url: '/tools/conversion/markdown-to-html',
      icon: icons.FileMarkdownOutlined,
      breadcrumbs: false
    },
    {
      id: 'color-converter',
      title: 'Color Converter',
      type: 'item',
      url: '/tools/conversion/color-converter',
      icon: icons.BgColorsOutlined,
      breadcrumbs: false
    },
    {
      id: 'code-converters',
      title: 'Code converter',
      type: 'item',
      url: '/tools/conversion/code-converters',
      icon: icons.CodeOutlined,
      breadcrumbs: false
    }
  ]
};

export default conversionTools;
