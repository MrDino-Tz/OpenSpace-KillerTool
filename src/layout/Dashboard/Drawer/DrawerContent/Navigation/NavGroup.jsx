import { useState } from 'react';
import PropTypes from 'prop-types';
// material-ui
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import ListItemButton from '@mui/material/ListItemButton';

// project import
import NavItem from './NavItem';
import { useGetMenuMaster } from 'api/menu';
import RightOutlined from '@ant-design/icons/RightOutlined';
import DownOutlined from '@ant-design/icons/DownOutlined';

export default function NavGroup({ item }) {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const [open, setOpen] = useState(true);

  const navCollapse = item.children?.map((menuItem) => {
    switch (menuItem.type) {
      case 'collapse':
        return (
          <Typography key={menuItem.id} variant="caption" color="error" sx={{ p: 2.5 }}>
            collapse - only available in paid version
          </Typography>
        );
      case 'item':
        return <NavItem key={menuItem.id} item={menuItem} level={1} />;
      default:
        return (
          <Typography key={menuItem.id} variant="h6" color="error" align="center">
            Fix - Group Collapse or Items
          </Typography>
        );
    }
  });

  return (
    <List sx={{ mb: drawerOpen ? 1.5 : 0, py: 0, zIndex: 0 }}>
      {drawerOpen && (
        <ListItemButton
          onClick={() => setOpen((prev) => !prev)}
          sx={{ pl: 2.5, py: 0.75, '&:hover': { bgcolor: 'action.hover' } }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: 1 }}>
            {open ? (
              <DownOutlined style={{ fontSize: 10, color: 'text.secondary' }} />
            ) : (
              <RightOutlined style={{ fontSize: 10, color: 'text.secondary' }} />
            )}
            <Typography variant="subtitle2" color="textSecondary">
              {item.title}
            </Typography>
          </Box>
        </ListItemButton>
      )}
      <Collapse in={open} timeout="auto" unmountOnExit>
        {navCollapse}
      </Collapse>
    </List>
  );
}

NavGroup.propTypes = { item: PropTypes.object };
