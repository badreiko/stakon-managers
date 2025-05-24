import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { 
  ViewKanban as ViewKanbanIcon, 
  ViewList as ViewListIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskList from '../components/tasks/TaskList';
import TaskDetail from '../components/tasks/TaskDetail';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tasks-tabpanel-${index}`}
      aria-labelledby={`tasks-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `tasks-tab-${index}`,
    'aria-controls': `tasks-tabpanel-${index}`,
  };
}

const Tasks: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<string>('kanban');

  // Determine the active tab based on the current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/tasks/detail/')) {
      return -1; // Detail view is not a tab
    } else if (path === '/tasks' || path === '/tasks/kanban') {
      return 0; // Kanban view
    } else if (path === '/tasks/list') {
      return 1; // List view
    } else if (path === '/tasks/calendar') {
      return 2; // Calendar view
    }
    return 0; // Default to kanban
  };

  const activeTab = getActiveTab();

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/tasks/kanban');
        break;
      case 1:
        navigate('/tasks/list');
        break;
      case 2:
        navigate('/tasks/calendar');
        break;
      default:
        navigate('/tasks');
    }
  };

  // Handle view mode change
  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: string | null
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
      switch (newViewMode) {
        case 'kanban':
          navigate('/tasks/kanban');
          break;
        case 'list':
          navigate('/tasks/list');
          break;
        case 'calendar':
          navigate('/tasks/calendar');
          break;
        default:
          navigate('/tasks');
      }
    }
  };

  // If we're in the detail view, render only the detail component
  if (activeTab === -1) {
    return (
      <Box sx={{ height: '100%' }}>
        <Routes>
          <Route path="/detail/:taskId" element={<TaskDetail />} />
        </Routes>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('tasks.title')}
        </Typography>
        
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="task view mode"
        >
          <ToggleButton value="kanban" aria-label="kanban view">
            <ViewKanbanIcon />
          </ToggleButton>
          <ToggleButton value="list" aria-label="list view">
            <ViewListIcon />
          </ToggleButton>
          <ToggleButton value="calendar" aria-label="calendar view">
            <CalendarIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="task view tabs"
          sx={{ '& .MuiTab-root': { minWidth: 120 } }}
        >
          <Tab 
            icon={<ViewKanbanIcon />} 
            label={t('tasks.kanban.title')} 
            {...a11yProps(0)} 
          />
          <Tab 
            icon={<ViewListIcon />} 
            label={t('tasks.list.title')} 
            {...a11yProps(1)} 
          />
          <Tab 
            icon={<CalendarIcon />} 
            label={t('common.calendar')} 
            {...a11yProps(2)} 
          />
        </Tabs>
      </Box>
      
      <Box sx={{ height: 'calc(100% - 120px)' }}>
        <Routes>
          <Route path="/" element={<KanbanBoard />} />
          <Route path="/kanban" element={<KanbanBoard />} />
          <Route path="/list" element={<TaskList />} />
          <Route path="/calendar" element={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <CalendarIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  {t('common.comingSoon')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {t('common.featureUnderDevelopment')}
                </Typography>
              </Paper>
            </Box>
          } />
        </Routes>
      </Box>
    </Box>
  );
};

export default Tasks;
