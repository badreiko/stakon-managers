import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  ListSubheader,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import { 
  Task as TaskIcon,
  Folder as FolderIcon,
  Person as UserIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { SearchProps, SearchResult } from '../../types/search.types';

// Компонент для подсветки найденного текста
const HighlightText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim()) return <>{text}</>;

  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <Box key={i} component="span" sx={{ bgcolor: 'warning.light', px: 0.5 }}>
            {part}
          </Box>
        ) : (
          part
        )
      )}
    </>
  );
};

const DashboardSearchResults: React.FC<SearchProps> = ({ 
  results, 
  isLoading, 
  onResultClick,
  query 
}) => {
  const { t } = useTranslation();

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <CircularProgress size={20} />
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Hledání "{query}"...
        </Typography>
      </Box>
    );
  }

  if (results.length === 0 && query.trim()) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Žádné výsledky pro "{query}"
        </Typography>
      </Box>
    );
  }

  // Группируем по типам
  const tasks = results.filter(r => r.type === 'task');
  const projects = results.filter(r => r.type === 'project');

  return (
    <List sx={{ p: 0 }}>
      {tasks.length > 0 && (
        <>
          <ListSubheader sx={{ bgcolor: 'background.default', color: 'primary.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon sx={{ mr: 1, fontSize: 16 }} />
              Úkoly ({tasks.length})
            </Box>
          </ListSubheader>
          {tasks.map((task) => (
            <ListItem
              key={task.id}
              button
              onClick={() => onResultClick(task)}
              sx={{ 
                pl: 3,
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: getPriorityColor(task.priority || 'medium')
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    <HighlightText text={task.title} highlight={query} />
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    {task.status && (
                      <Chip
                        label={t(`tasks.statuses.${task.status}`)}
                        size="small"
                        sx={{ height: 16, fontSize: '0.7rem' }}
                      />
                    )}
                    {task.dueDate && (
                      <Typography variant="caption" color="text.secondary">
                        {task.dueDate}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </>
      )}

      {projects.length > 0 && (
        <>
          <ListSubheader sx={{ bgcolor: 'background.default', color: 'primary.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FolderIcon sx={{ mr: 1, fontSize: 16 }} />
              Projekty ({projects.length})
            </Box>
          </ListSubheader>
          {projects.map((project) => (
            <ListItem
              key={project.id}
              button
              onClick={() => onResultClick(project)}
              sx={{ 
                pl: 3,
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <FolderIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    <HighlightText text={project.title} highlight={query} />
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {project.description}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </>
      )}
    </List>
  );
};

export default DashboardSearchResults;
