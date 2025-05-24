import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, IconButton, Menu, MenuItem, TextField, InputAdornment, Tooltip, Card, CardContent, CardActions } from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Task, TaskStatus } from '../../types/task.types';
// import { User } from '../../types/user.types';
import { getTasks, updateTaskStatus } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import TaskForm from './TaskForm';
import TaskDetail from './TaskDetail';
// Простая реализация компонента LoadingSpinner вместо импорта
const LoadingSpinner: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
      <Typography>Loading...</Typography>
    </Box>
  );
};

// Define column structure
interface Column {
  id: TaskStatus;
  title: string;
  color: string;
}

// Define the columns for the kanban board
const columns: Column[] = [
  { id: 'new', title: 'New', color: 'rgba(224, 224, 224, 0.2)' },
  { id: 'inProgress', title: 'In Progress', color: 'rgba(144, 202, 249, 0.2)' },
  { id: 'review', title: 'Review', color: 'rgba(255, 224, 130, 0.2)' },
  { id: 'done', title: 'Done', color: 'rgba(165, 214, 167, 0.2)' },
  { id: 'cancelled', title: 'Cancelled', color: 'rgba(239, 154, 154, 0.2)' }
];

// Task card component that uses dnd-kit sortable
const SortableTaskCard = ({ task, onTaskClick, onMenuOpen }: { 
  task: Task; 
  onTaskClick: (task: Task) => void; 
  onMenuOpen: (e: React.MouseEvent<HTMLElement>, task: Task) => void;
}) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <Card 
      ref={setNodeRef}
      style={style}
      sx={{ 
        mb: 2, 
        cursor: 'grab',
        '&:hover': { boxShadow: 3 } 
      }}
      onClick={() => onTaskClick(task)}
      {...attributes}
      {...listeners}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
            {task.title}
          </Typography>
          <IconButton 
            size="small" 
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              onMenuOpen(e, task);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {task.description}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={t('tasks.deadline')}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                <CalendarIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="caption">
                  {format(new Date(task.deadline), 'dd.MM.yyyy')}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
          
          {task.assignee && (
            <Tooltip title={t('tasks.assignee')}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="caption">
                  {task.assignee}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      </CardContent>
      <CardActions sx={{ pt: 0 }}>
        <Box 
          sx={{ 
            bgcolor: task.priority === 'critical' ? 'error.main' : 
                    task.priority === 'high' ? 'warning.main' : 
                    task.priority === 'medium' ? 'info.main' : 'success.main',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'medium'
          }}
        >
          {t(`tasks.priorities.${task.priority}`)}
        </Box>
      </CardActions>
    </Card>
  );
};

// KanbanBoard component
const KanbanBoard: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Define sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const result = await getTasks();
        setTasks(result.tasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);
  
  // Filter tasks by search term
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group tasks by status
  const tasksByStatus = columns.reduce((acc, column) => {
    acc[column.id] = filteredTasks.filter(task => task.status === column.id);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle filter menu
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Handle task menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedTask(null);
  };
  
  // Handle task click
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };
  
  // Handle task detail close
  const handleTaskDetailClose = () => {
    setTaskDetailOpen(false);
    setSelectedTask(null);
  };
  
  // Handle edit task
  const handleEditTask = () => {
    if (selectedTask) {
      setEditingTask(selectedTask);
      setTaskFormOpen(true);
      handleMenuClose();
    }
  };
  
  // Handle add task
  const handleAddTask = () => {
    setEditingTask(null);
    setTaskFormOpen(true);
  };
  
  // Handle task form close
  const handleTaskFormClose = () => {
    setTaskFormOpen(false);
    setEditingTask(null);
  };
  
  // Handle task form success
  const handleTaskFormSuccess = () => {
    // Refresh tasks
    getTasks().then(result => {
      setTasks(result.tasks);
    }).catch(error => {
      console.error('Error fetching tasks:', error);
    });
    
    handleTaskFormClose();
  };
  
  // Handle drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Find the task that was dragged
    const task = tasks.find(t => t.id === active.id);
    if (!task) return;
    
    // Get the column ID (which is the task status)
    const dropColumnId = over.id.toString() as TaskStatus;
    
    // If the task was dropped in a different column
    if (task.status !== dropColumnId) {
      // Update the task status
      if (currentUser) {
        updateTaskStatus(task.id, dropColumnId, currentUser.uid)
          .then(updatedTask => {
            // Update the task in the local state
            setTasks(prevTasks => 
              prevTasks.map(t => 
                t.id === updatedTask.id ? updatedTask : t
              )
            );
          })
          .catch(error => {
            console.error('Error updating task status:', error);
          });
      }
    }
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Box sx={{ height: 'calc(100vh - 170px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          {t('tasks.kanbanBoard')}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          
          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />}
            onClick={handleFilterClick}
          >
            {t('common.filter')}
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddTask}
          >
            {t('tasks.addTask')}
          </Button>
        </Box>
      </Box>
      
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={handleFilterClose}>{t('tasks.filters.all')}</MenuItem>
        <MenuItem onClick={handleFilterClose}>{t('tasks.filters.myTasks')}</MenuItem>
        <MenuItem onClick={handleFilterClose}>{t('tasks.filters.highPriority')}</MenuItem>
        <MenuItem onClick={handleFilterClose}>{t('tasks.filters.dueThisWeek')}</MenuItem>
      </Menu>
      
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditTask}>{t('common.edit')}</MenuItem>
        <MenuItem onClick={handleMenuClose}>{t('common.delete')}</MenuItem>
      </Menu>
      
      {taskFormOpen && (
        <TaskForm
          task={editingTask || undefined}
          open={taskFormOpen}
          onClose={handleTaskFormClose}
          onSuccess={handleTaskFormSuccess}
        />
      )}
      
      {/* Render TaskDetail component when a task is selected */}
      {taskDetailOpen && selectedTask && (
        <TaskDetail />
      )}
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${columns.length}, 1fr)`, 
          gap: 2,
          height: '100%',
          overflowX: 'auto',
          pb: 2
        }}>
          {columns.map((column) => (
            <Paper
              key={column.id}
              sx={{
                bgcolor: column.color,
                p: 2,
                height: '100%',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
                pb: 1,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  {t(`tasks.statuses.${column.id}`)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {tasksByStatus[column.id]?.length || 0}
                </Typography>
              </Box>
              
              <SortableContext
                items={tasksByStatus[column.id]?.map(task => task.id) || []}
                strategy={verticalListSortingStrategy}
              >
                {tasksByStatus[column.id]?.map((task) => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    onTaskClick={handleTaskClick}
                    onMenuOpen={handleMenuOpen}
                  />
                ))}
              </SortableContext>
              
              <Button
                startIcon={<AddIcon />}
                sx={{ mt: 'auto', alignSelf: 'flex-start' }}
                onClick={() => {
                  setEditingTask({ status: column.id } as Task);
                  setTaskFormOpen(true);
                }}
              >
                {t('tasks.addTask')}
              </Button>
            </Paper>
          ))}
        </Box>
      </DndContext>
    </Box>
  );
};

export default KanbanBoard;
