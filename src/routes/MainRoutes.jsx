import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';

// render- Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - text tools
const AsciiGenerator = Loadable(lazy(() => import('pages/tools/text/AsciiGenerator')));
const EmojiPicker = Loadable(lazy(() => import('pages/tools/text/EmojiPicker')));

// render - conversion tools
const EncodersDecoders = Loadable(lazy(() => import('pages/tools/conversion/EncodersDecoders')));
const CodeConverters = Loadable(lazy(() => import('pages/tools/conversion/CodeConverters')));
const MathLogic = Loadable(lazy(() => import('pages/tools/conversion/MathLogic')));
const TextCaseConverters = Loadable(lazy(() => import('pages/tools/conversion/TextCaseConverters')));
const OtherConverters = Loadable(lazy(() => import('pages/tools/conversion/OtherConverters')));

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
              path: 'encoders-decoders',
              element: <EncodersDecoders />
            },
            {
              path: 'code-converters',
              element: <CodeConverters />
            },
            {
              path: 'math-logic',
              element: <MathLogic />
            },
            {
              path: 'text-case-converters',
              element: <TextCaseConverters />
            },
            {
              path: 'other-converters',
              element: <OtherConverters />
            }
          ]
        }
      ]
    }
  ]
};

export default MainRoutes;
