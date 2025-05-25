import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Badge, 
  Avatar, 
  Menu, 
  MenuItem, 
  InputBase,
  Box,
  Tooltip,
  Popover,
  Divider,
  Button
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { 
  Menu as MenuIcon, 
  Search as SearchIcon, 
  Notifications as NotificationsIcon, 
  NotificationsNone as NotificationsNoneIcon,
  Brightness4 as DarkModeIcon, 
  Brightness7 as LightModeIcon,
  MarkChatRead as MarkAllReadIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useNotifications } from '../../context/NotificationContext';
import NotificationList from '../notifications/NotificationList';
import ConstructionVehicles from '../animations/ConstructionVehicles';

const Search = styled('div')(({ theme }: { theme: any }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }: { theme: any }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }: { theme: any }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

interface HeaderProps {
  open: boolean;
  handleDrawerOpen: () => void;
}

const Header: React.FC<HeaderProps> = ({ open, handleDrawerOpen }) => {
  const { t } = useTranslation();
  const { mode, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsMenuClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const isMenuOpen = Boolean(anchorEl);
  const isNotificationsMenuOpen = Boolean(notificationsAnchorEl);

  const menuId = 'primary-search-account-menu';
  const notificationsMenuId = 'primary-notifications-menu';

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>{t('settings.profile')}</MenuItem>
      <MenuItem onClick={handleMenuClose}>{t('settings.account')}</MenuItem>
      <MenuItem onClick={handleMenuClose}>{t('auth.logout')}</MenuItem>
    </Menu>
  );

  const renderNotificationsMenu = (
    <Popover
      anchorEl={notificationsAnchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id={notificationsMenuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isNotificationsMenuOpen}
      onClose={handleNotificationsMenuClose}
      PaperProps={{
        sx: { width: 320, maxHeight: 450, overflow: 'hidden' }
      }}
    >
      <NotificationList onClose={handleNotificationsMenuClose} />
    </Popover>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme: any) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            STAKON
          </Typography>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder={`${t('common.search')}...`}
              inputProps={{ 'aria-label': 'search' }}
            />
          </Search>
          <Box sx={{ flexGrow: 1, position: 'relative', height: '40px', mx: 2 }}>
            <ConstructionVehicles />
          </Box>
          <Box sx={{ display: 'flex', position: 'relative', zIndex: 1 }}>
            <Tooltip title={mode === 'light' ? 'Tmavý režim' : 'Světlý režim'}>
              <IconButton color="inherit" onClick={toggleTheme}>
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title={t('notifications.title')}>
              <IconButton
                color="inherit"
                aria-label="show new notifications"
                aria-controls={notificationsMenuId}
                aria-haspopup="true"
                onClick={handleNotificationsMenuOpen}
              >
                <Badge badgeContent={unreadCount} color="error" invisible={unreadCount === 0}>
                  {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
                </Badge>
              </IconButton>
            </Tooltip>
            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar alt="Jan Novák" src="/static/images/avatar/1.jpg" sx={{ width: 32, height: 32 }} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {renderMenu}
      {renderNotificationsMenu}
    </>
  );
};

export default Header;
