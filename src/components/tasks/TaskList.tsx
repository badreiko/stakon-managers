import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Avatar, 
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon,
  FilterList as FilterListIcon,
  GetApp as ExportIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams, GridValueFormatterParams } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskStatus, TaskPriority } from '../../types/task.types';
import { User } from '../../types/user.types';
import { Project } from '../../types/project.types';
import { getTasks, updateTaskStatus, updateTaskAssignee, deleteTask } from '../../services/taskService';
import { getUsers } from '../../services/userService';
import { getActiveProjects } from '../../services/projectService';
import TaskForm from './TaskForm';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../theme/theme';

// Get priority color
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical':
      return PRIORITY_COLORS.critical;
    case 'high':
      return PRIORITY_COLORS.high;
    case 'medium':
      return PRIORITY_COLORS.medium;
    case 'low':
      return PRIORITY_COLORS.low;
    default:
      return PRIORITY_COLORS.medium;
  }
};

// Get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'new':
      return STATUS_COLORS.new;
    case 'inProgress':
      return STATUS_COLORS.inProgress;
    case 'review':
      return STATUS_COLORS.review;
    case 'done':
      return STATUS_COLORS.done;
    case 'cancelled':
      return STATUS_COLORS.cancelled;
    default:
      return STATUS_COLORS.new;
  }
};

const TaskList: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [bulkMenuAnchorEl, setBulkMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assigneeDialogOpen, setAssigneeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<TaskStatus>('new');
  const [newAssignee, setNewAssignee] = useState<string>('');

  // Fetch tasks, users, and projects
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { tasks: fetchedTasks } = await getTasks();
        const fetchedUsers = await getUsers();
        const fetchedProjects = await getActiveProjects();
        
        setTasks(fetchedTasks);
        setUsers(fetchedUsers);
        setProjects(fetchedProjects);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle task menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  // Handle task menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Handle bulk menu open
  const handleBulkMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setBulkMenuAnchorEl(event.currentTarget);
  };

  // Handle bulk menu close
  const handleBulkMenuClose = () => {
    setBulkMenuAnchorEl(null);
  };

  // Handle edit task
  const handleEditTask = () => {
    setTaskFormOpen(true);
    handleMenuClose();
  };

  // Handle delete task
  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    
    try {
      await deleteTask(selectedTask.id);
      
      // Remove the task from the list
      setTasks(tasks.filter(task => task.id !== selectedTask.id));
      
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Handle task form close
  const handleTaskFormClose = () => {
    setTaskFormOpen(false);
    setSelectedTask(null);
  };

  // Handle task form success
  const handleTaskFormSuccess = () => {
    // Refresh tasks
    const fetchTasks = async () => {
      try {
        const { tasks: fetchedTasks } = await getTasks();
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  };

  // Handle bulk status change
  const handleBulkStatusChange = async () => {
    try {
      // Update each selected task
      for (const taskId of selectedRows) {
        await updateTaskStatus(taskId, newStatus, currentUser?.uid || '');
      }
      
      // Update tasks in the UI
      setTasks(tasks.map(task => {
        if (selectedRows.includes(task.id)) {
          return { ...task, status: newStatus };
        }
        return task;
      }));
      
      setStatusDialogOpen(false);
      setBulkMenuAnchorEl(null);
    } catch (error) {
      console.error('Error updating tasks:', error);
    }
  };

  // Handle bulk assignee change
  const handleBulkAssigneeChange = async () => {
    try {
      // Update each selected task
      for (const taskId of selectedRows) {
        await updateTaskAssignee(taskId, newAssignee, currentUser?.uid || '');
      }
      
      // Update tasks in the UI
      setTasks(tasks.map(task => {
        if (selectedRows.includes(task.id)) {
          return { 
            ...task, 
            assignee: newAssignee
          };
        }
        return task;
      }));
      
      setAssigneeDialogOpen(false);
      setBulkMenuAnchorEl(null);
    } catch (error) {
      console.error('Error updating tasks:', error);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      // Delete each selected task
      for (const taskId of selectedRows) {
        await deleteTask(taskId);
      }
      
      // Remove tasks from the UI
      setTasks(tasks.filter(task => !selectedRows.includes(task.id)));
      
      setDeleteDialogOpen(false);
      setBulkMenuAnchorEl(null);
    } catch (error) {
      console.error('Error deleting tasks:', error);
    }
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    // Get tasks to export (either selected or all)
    const tasksToExport = selectedRows.length > 0 
      ? tasks.filter(task => selectedRows.includes(task.id))
      : tasks;
    
    // Create CSV content
    const headers = [
      'ID',
      t('tasks.taskName'),
      t('tasks.description'),
      t('tasks.assignee'),
      t('tasks.priority'),
      t('tasks.status'),
      t('tasks.project'),
      t('tasks.deadline'),
      t('tasks.estimatedTime'),
      t('tasks.details.progress'),
      t('tasks.tags')
    ].join(',');
    
    const rows = tasksToExport.map(task => [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      `"${task.description.replace(/"/g, '""')}"`,
      `"${getUserById(task.assignee)?.displayName || ''}"`,
      t(`tasks.priorities.${task.priority}`),
      t(`tasks.statuses.${task.status}`),
      `"${getProjectById(task.project)?.name || ''}"`,
      format(task.deadline, 'dd.MM.yyyy HH:mm'),
      task.estimatedTime,
      `${task.progress}%`,
      `"${task.tags.join(', ')}"`
    ].join(','));
    
    const csvContent = [headers, ...rows].join('\n');
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tasks_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    handleBulkMenuClose();
  };

  // Get user by ID
  const getUserById = (userId: string) => {
    return users.find(user => user.uid === userId);
  };

  // Get project by ID
  const getProjectById = (projectId: string) => {
    return projects.find(project => project.id === projectId);
  };

  // Define columns for the data grid
  const columns: GridColDef[] = [
    {
      field: 'priority',
      headerName: t('tasks.priority'),
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={t(`tasks.priorities.${params.value}`)} 
          size="small" 
          sx={{ 
            bgcolor: `${getPriorityColor(params.value)}20`,
            color: getPriorityColor(params.value),
            fontWeight: 'bold'
          }} 
        />
      ),
      sortable: true
    },
    {
      field: 'title',
      headerName: t('tasks.taskName'),
      flex: 1,
      minWidth: 200,
      sortable: true
    },
    {
      field: 'assignee',
      headerName: t('tasks.assignee'),
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const user = getUserById(params.value);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {user && (
              <>
                <Avatar 
                  src={user.photoURL} 
                  alt={user.displayName}
                  sx={{ width: 24, height: 24, mr: 1 }}
                >
                  {user.displayName.charAt(0)}
                </Avatar>
                <Typography variant="body2">
                  {user.displayName}
                </Typography>
              </>
            )}
          </Box>
        );
      },
      sortable: true
    },
    {
      field: 'project',
      headerName: t('tasks.project'),
      width: 150,
      valueFormatter: (params: GridValueFormatterParams<string>) => {
        const project = getProjectById(params.value);
        return project ? project.name : '';
      },
      sortable: true
    },
    {
      field: 'status',
      headerName: t('tasks.status'),
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={t(`tasks.statuses.${params.value}`)} 
          size="small" 
          sx={{ 
            bgcolor: getStatusColor(params.value),
            color: 'text.primary',
            fontWeight: 'medium'
          }} 
        />
      ),
      sortable: true
    },
    {
      field: 'deadline',
      headerName: t('tasks.deadline'),
      width: 150,
      valueFormatter: (params: GridValueFormatterParams<Date>) => {
        return format(params.value, 'dd.MM.yyyy');
      },
      sortable: true
    },
    {
      field: 'progress',
      headerName: t('tasks.details.progress'),
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%', mr: 1 }}>
          <Box sx={{ 
            width: '100%', 
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Box
              sx={{
                width: `${params.value}%`,
                bgcolor: params.value >= 100 ? 'success.main' : 'primary.main',
                height: 10,
                borderRadius: 1
              }}
            />
          </Box>
          <Typography variant="caption" align="center" display="block">
            {params.value}%
          </Typography>
        </Box>
      ),
      sortable: true
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            size="small"
            onClick={(e: React.MouseEvent<HTMLElement>) => handleMenuOpen(e, params.row)}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('tasks.list.title')}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {selectedRows.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={handleBulkMenuOpen}
            >
              {t('tasks.list.bulkActions')}
            </Button>
          )}
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedTask(null);
              setTaskFormOpen(true);
            }}
          >
            {t('tasks.newTask')}
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
        <DataGrid
          rows={tasks || []}
          columns={columns}
          loading={loading}
          checkboxSelection
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
          onRowSelectionModelChange={(newSelection) => {
            setSelectedRows(newSelection as string[]);
          }}
          rowSelectionModel={selectedRows}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 }
            },
            sorting: {
              sortModel: [{ field: 'deadline', sort: 'asc' }]
            }
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </Paper>
      
      {/* Task menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditTask}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={handleDeleteTask}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.delete')}
        </MenuItem>
      </Menu>
      
      {/* Bulk actions menu */}
      <Menu
        anchorEl={bulkMenuAnchorEl}
        open={Boolean(bulkMenuAnchorEl)}
        onClose={handleBulkMenuClose}
      >
        <MenuItem onClick={() => {
          setStatusDialogOpen(true);
          handleBulkMenuClose();
        }}>
          {t('tasks.list.changeStatus')}
        </MenuItem>
        <MenuItem onClick={() => {
          setAssigneeDialogOpen(true);
          handleBulkMenuClose();
        }}>
          {t('tasks.list.assign')}
        </MenuItem>
        <MenuItem onClick={() => {
          setDeleteDialogOpen(true);
          handleBulkMenuClose();
        }}>
          {t('common.delete')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleExportCSV}>
          <ExportIcon fontSize="small" sx={{ mr: 1 }} />
          {t('tasks.list.export')}
        </MenuItem>
      </Menu>
      
      {/* Status change dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>{t('tasks.list.changeStatus')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="new-status-label">{t('tasks.status')}</InputLabel>
            <Select
              labelId="new-status-label"
              value={newStatus}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStatus(e.target.value as TaskStatus)}
              input={<OutlinedInput label={t('tasks.status')} />}
            >
              <MenuItem value="new">{t('tasks.statuses.new')}</MenuItem>
              <MenuItem value="inProgress">{t('tasks.statuses.inProgress')}</MenuItem>
              <MenuItem value="review">{t('tasks.statuses.review')}</MenuItem>
              <MenuItem value="done">{t('tasks.statuses.done')}</MenuItem>
              <MenuItem value="cancelled">{t('tasks.statuses.cancelled')}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleBulkStatusChange} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Assignee change dialog */}
      <Dialog open={assigneeDialogOpen} onClose={() => setAssigneeDialogOpen(false)}>
        <DialogTitle>{t('tasks.list.assign')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="new-assignee-label">{t('tasks.assignee')}</InputLabel>
            <Select
              labelId="new-assignee-label"
              value={newAssignee}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAssignee(e.target.value)}
              input={<OutlinedInput label={t('tasks.assignee')} />}
            >
              {users.map((user) => (
                <MenuItem key={user.uid} value={user.uid}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      src={user.photoURL} 
                      alt={user.displayName}
                      sx={{ width: 24, height: 24, mr: 1 }}
                    >
                      {user.displayName.charAt(0)}
                    </Avatar>
                    {user.displayName}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssigneeDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleBulkAssigneeChange} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('common.delete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('common.deleteConfirmation', { count: selectedRows.length })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleBulkDelete} variant="contained" color="error">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Task form dialog */}
      {taskFormOpen && (
        <TaskForm
          task={selectedTask || undefined}
          open={taskFormOpen}
          onClose={handleTaskFormClose}
          onSuccess={handleTaskFormSuccess}
        />
      )}
    </Box>
  );
};

export default TaskList;
