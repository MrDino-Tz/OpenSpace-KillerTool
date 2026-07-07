// project imports

import { useState } from 'react';
import Navigation from './Navigation';
import SimpleBar from 'components/third-party/SimpleBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { BulbOutlined } from '@ant-design/icons';
import SuggestDialog from 'components/SuggestDialog';
import { useGetMenuMaster } from 'api/menu';

// ==============================|| DRAWER CONTENT ||============================== //

export default function DrawerContent() {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const [suggestOpen, setSuggestOpen] = useState(false);

  return (
    <>
      <SimpleBar sx={{ '& .simplebar-content': { display: 'flex', flexDirection: 'column' } }}>
        <Navigation />

        <Box sx={{ mt: 'auto', p: 2 }}>
          <Tooltip title="Suggest a feature" placement="right">
            <Button
              variant="contained"
              color="warning"
              startIcon={<BulbOutlined />}
              onClick={() => setSuggestOpen(true)}
              fullWidth
            >
              {drawerOpen ? 'Suggest' : <BulbOutlined />}
            </Button>
          </Tooltip>
        </Box>
      </SimpleBar>

      <SuggestDialog open={suggestOpen} onClose={() => setSuggestOpen(false)} />
    </>
  );
}
