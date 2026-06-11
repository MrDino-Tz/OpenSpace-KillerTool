import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';

// render- Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - crypto tools
const PasswordGenerator = Loadable(lazy(() => import('pages/tools/crypto/PasswordGenerator')));
const PasswordAnalyzer = Loadable(lazy(() => import('pages/tools/crypto/PasswordAnalyzer')));
const PdfSignatureChecker = Loadable(lazy(() => import('pages/tools/crypto/PdfSignatureChecker')));

// render - conversion tools
const AsciiGenerator = Loadable(lazy(() => import('pages/tools/text/AsciiGenerator')));
const EmojiPicker = Loadable(lazy(() => import('pages/tools/text/EmojiPicker')));

const TextToBinary = Loadable(lazy(() => import('pages/tools/conversion/TextToBinary')));
const MarkdownToHtml = Loadable(lazy(() => import('pages/tools/conversion/MarkdownToHtml')));
const ColorConverter = Loadable(lazy(() => import('pages/tools/conversion/ColorConverter')));

// render - media tools
const ImageResizer = Loadable(lazy(() => import('pages/tools/media/ImageResizer')));
const PhotoEditor = Loadable(lazy(() => import('pages/tools/media/PhotoEditor')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <DashboardLayout />,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'tools',
      children: [
        {
          path: 'text',
          children: [
            {
              path: 'ascii-generator',
              element: <AsciiGenerator />
            },
            {
              path: 'emoji-picker',
              element: <EmojiPicker />
            }
          ]
        },
        {
          path: 'conversion',
          children: [
            {
              path: 'text-to-binary',
              element: <TextToBinary />
            },
            {
              path: 'markdown-to-html',
              element: <MarkdownToHtml />
            },
            {
              path: 'color-converter',
              element: <ColorConverter />
            }
          ]
        },
        {
          path: 'crypto',
          children: [
            {
              path: 'password-generator',
              element: <PasswordGenerator />
            },
            {
              path: 'password-analyzer',
              element: <PasswordAnalyzer />
            },
            {
              path: 'pdf-signature-checker',
              element: <PdfSignatureChecker />
            }
          ]
        },
        {
          path: 'media',
          children: [
            {
              path: 'image-resizer',
              element: <ImageResizer />
            },
            {
              path: 'photo-editor',
              element: <PhotoEditor />
            }
          ]
        }
      ]
    }
  ]
};

export default MainRoutes;
