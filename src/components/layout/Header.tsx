import React, { useState, useRef, useEffect } from 'react';
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
  Button,
  Paper
} from '@mui/material';
import { styled, alpha } from '@mui/material';
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
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../theme/ThemeProvider';
import { useNotifications } from '../../context/NotificationContext';
import NotificationList from '../notifications/NotificationList';
import ConstructionVehicles from '../animations/ConstructionVehicles';
import DashboardSearchResults from '../search/DashboardSearchResults';
import { searchDashboardItems } from '../../services/searchService';
import { SearchResult } from '../../types/search.types';

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
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Поиск только на дашборде
  const isDashboard = location.pathname === '/';
  
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

  const handleSearchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (!query.trim() || !isDashboard) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    setIsSearching(true);
    setSearchOpen(true);

    // Дебаунс поиска
    setTimeout(async () => {
      try {
        const results = await searchDashboardItems(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'task') {
      // Прокручиваем к задаче на дашборде или открываем детали
      const taskElement = document.getElementById(`task-${result.id}`);
      if (taskElement) {
        taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        taskElement.style.animation = 'highlight 2s ease-in-out';
      }
    } else if (result.type === 'project') {
      navigate(`/projects`);
    }
    
    setSearchQuery('');
    setSearchOpen(false);
  };

  // Закрытие по клику вне поиска
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            J.B.STAKON
          </Typography>
          <Box ref={searchRef} sx={{ position: 'relative' }}>
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder={isDashboard ? `${t('dashboard.searchTasks')}...` : `${t('common.search')}...`}
                inputProps={{ 'aria-label': 'search' }}
                value={searchQuery}
                onChange={handleSearchChange}
                disabled={!isDashboard}
                sx={{ 
                  opacity: isDashboard ? 1 : 0.5,
                  cursor: isDashboard ? 'text' : 'not-allowed'
                }}
              />
            </Search>

            {/* Результаты поиска */}
            {searchOpen && (
              <Paper
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  mt: 1,
                  maxHeight: 400,
                  overflow: 'auto',
                  zIndex: 1300,
                  boxShadow: 3
                }}
              >
                <DashboardSearchResults
                  results={searchResults}
                  isLoading={isSearching}
                  onResultClick={handleResultClick}
                  query={searchQuery}
                />
              </Paper>
            )}
          </Box>
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
