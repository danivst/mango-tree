import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Drawer variant="permanent">
      <List>
        <ListItemButton onClick={() => navigate('/')}>
          <ListItemText primary="Home" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate('/upload')}>
          <ListItemText primary="Upload" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate('/notifications')}>
          <ListItemText primary="Notifications" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate('/profile')}>
          <ListItemText primary="Profile" />
        </ListItemButton>

        {user?.role === 'admin' && (
          <>
            <ListItemButton onClick={() => navigate('/admin')}>
              <ListItemText primary="Admin Dashboard" />
            </ListItemButton>

            <ListItemButton onClick={() => navigate('/admin/users')}>
              <ListItemText primary="Users" />
            </ListItemButton>

            <ListItemButton onClick={() => navigate('/admin/reports')}>
              <ListItemText primary="Reports" />
            </ListItemButton>
          </>
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;
