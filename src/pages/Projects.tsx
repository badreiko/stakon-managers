import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pause as PauseIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { Project, ProjectStatus } from '../types/project.types';
import { User } from '../types/user.types';
import { getProjects, createProject, updateProject, archiveProject, deleteProject } from '../services/projectService';
import { getUsers } from '../services/userService';

const statusColors: Record<ProjectStatus, string> = {
  active: '#4CAF50',
  completed: '#2196F3',
  onHold: '#FFC107',
  cancelled: '#F44336',
  archived: '#9E9E9E'
};

const Projects: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: '',
    status: 'active' as ProjectStatus,
    deadline: ''
  });

  // Fetch projects and users
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching projects and users...');
        
        const [fetchedProjects, fetchedUsers] = await Promise.all([
          getProjects(),
          getUsers()
        ]);
        
        console.log('Fetched projects:', fetchedProjects);
        console.log('Fetched users:', fetchedUsers);
        
        setProjects(fetchedProjects);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(`Chyba při načítání dat: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedProject(null);
  };

  // Handle edit project
  const handleEditProject = () => {
    if (!selectedProject) return;
    
    setFormData({
      name: selectedProject.name,
      description: selectedProject.description,
      manager: selectedProject.manager,
      status: selectedProject.status,
      deadline: selectedProject.deadline ? format(selectedProject.deadline, 'yyyy-MM-dd') : ''
    });
    
    setProjectFormOpen(true);
    handleMenuClose();
  };

  // Handle archive project
  const handleArchiveProject = async () => {
    if (!selectedProject) return;
    
    try {
      console.log('Archiving project:', selectedProject.id);
      await archiveProject(selectedProject.id);
      
      // Update the project in the UI
      setProjects(projects.map(project => 
        project.id === selectedProject.id ? { ...project, status: 'archived' } : project
      ));
      
      handleMenuClose();
    } catch (error) {
      console.error('Error archiving project:', error);
      setError(`Chyba při archivaci projektu: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle delete project
  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    
    try {
      console.log('Deleting project:', selectedProject.id);
      await deleteProject(selectedProject.id);
      
      // Remove the project from the UI
      setProjects(projects.filter(project => project.id !== selectedProject.id));
      
      setDeleteDialogOpen(false);
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(`Chyba při mazání projektu: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle form close
  const handleFormClose = () => {
    setProjectFormOpen(false);
    setSelectedProject(null);
    setFormData({
      name: '',
      description: '',
      manager: '',
      status: 'active',
      deadline: ''
    });
    setError(null);
  };

  // Handle form submit
  const handleFormSubmit = async () => {
    if (!currentUser) {
      setError('Uživatel není přihlášen');
      return;
    }
    
    // Validate form
    if (!formData.name.trim()) {
      setError('Název projektu je povinný');
      return;
    }
    
    setFormLoading(true);
    setError(null);
    
    try {
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        manager: formData.manager,
        status: formData.status,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
        startDate: new Date(),
        createdBy: currentUser.uid,
        members: [],
        tags: []
      };

      console.log('Submitting project data:', projectData);

      if (selectedProject) {
        // Update existing project
        console.log('Updating existing project:', selectedProject.id);
        const updatedProject = await updateProject(selectedProject.id, projectData);
        
        // Update the project in the UI
        setProjects(projects.map(project => 
          project.id === selectedProject.id ? updatedProject : project
        ));
        
        console.log('Project updated successfully');
      } else {
        // Create new project
        console.log('Creating new project');
        const newProject = await createProject(projectData);
        
        // Add the new project to the UI
        setProjects(prevProjects => [newProject, ...prevProjects]);
        
        console.log('Project created successfully:', newProject);
      }
      
      // Close the form
      handleFormClose();
    } catch (error) {
      console.error('Error saving project:', error);
      setError(`Chyba při ukládání projektu: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Get user by ID
  const getUserById = (userId: string) => {
    return users.find(user => user.uid === userId);
  };

  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd.MM.yyyy', { locale: cs });
  };

  // Calculate project progress
  const calculateProgress = (project: Project) => {
    if (!project.statistics || !project.statistics.totalTasks) return 0;
    
    const { totalTasks, completedTasks } = project.statistics;
    if (totalTasks === 0) return 0;
    
    return Math.round((completedTasks / totalTasks) * 100);
  };

  // Get status color
  const getStatusColor = (status: ProjectStatus) => {
    return statusColors[status] || statusColors.active;
  };

  // Get status icon
  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case 'active': return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case 'completed': return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case 'onHold': return <PauseIcon sx={{ fontSize: 16 }} />;
      case 'cancelled': return <CancelIcon sx={{ fontSize: 16 }} />;
      case 'archived': return <InventoryIcon sx={{ fontSize: 16 }} />;
      default: return <CheckCircleIcon sx={{ fontSize: 16 }} />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('projects.title')}
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedProject(null);
            setProjectFormOpen(true);
          }}
        >
          {t('projects.newProject')}
        </Button>
      </Box>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      ) : projects.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Žádné projekty
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vytvořte svůj první projekt kliknutím na tlačítko "Nový projekt" výše
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h5" component="h2" gutterBottom sx={{ wordBreak: 'break-word' }}>
                      {project.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleMenuOpen(e, project)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Chip 
                    icon={getStatusIcon(project.status)}
                    label={t(`projects.statuses.${project.status}`)} 
                    size="small" 
                    sx={{ 
                      bgcolor: `${getStatusColor(project.status)}20`,
                      color: getStatusColor(project.status),
                      mb: 2
                    }} 
                  />
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2, 
                      height: 60, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {project.description || 'Bez popisu'}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                      <Typography variant="body2">
                        {project.manager && getUserById(project.manager) 
                          ? getUserById(project.manager)?.displayName 
                          : 'Nepřiřazeno'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                      <Typography variant="body2">
                        {project.deadline 
                          ? formatDate(project.deadline) 
                          : 'Bez termínu'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AssignmentIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                      <Typography variant="body2">
                        {project.statistics 
                          ? `${project.statistics.completedTasks}/${project.statistics.totalTasks} úkolů`
                          : '0/0 úkolů'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Průběh
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={calculateProgress(project)} 
                          sx={{ 
                            height: 10, 
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: calculateProgress(project) >= 100 ? 'success.main' : 'primary.main'
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {calculateProgress(project)}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" color="primary">
                    Zobrazit
                  </Button>
                  <Button 
                    size="small" 
                    color="primary" 
                    onClick={() => {
                      setSelectedProject(project);
                      handleEditProject();
                    }}
                  >
                    Upravit
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Project menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditProject}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Upravit
        </MenuItem>
        <MenuItem onClick={handleArchiveProject}>
          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
          Archivovat
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Smazat
        </MenuItem>
      </Menu>
      
      {/* Delete confirmation dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Smazat projekt
        </DialogTitle>
        <DialogContent>
          <Typography>
            Opravdu chcete smazat projekt "{selectedProject?.name}"? Tato akce je nevratná.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Zrušit
          </Button>
          <Button 
            onClick={handleDeleteProject} 
            variant="contained" 
            color="error"
          >
            Smazat
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* УЛУЧШЕННАЯ ФОРМА ПРОЕКТА */}
      <Dialog 
        open={projectFormOpen} 
        onClose={handleFormClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: 600 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
            {selectedProject ? 'Upravit projekt' : 'Nový projekt'}
          </Box>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ py: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* Základní informace */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                Základní informace
              </Typography>
            </Grid>
            
            {/* Název projektu */}
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Název projektu"
                fullWidth
                value={formData.name}
                onChange={handleFormChange}
                required
                disabled={formLoading}
                error={!formData.name.trim() && formData.name !== ''}
                helperText={!formData.name.trim() && formData.name !== '' ? 'Název projektu je povinný' : 'Zadejte výstižný název projektu'}
                variant="outlined"
                InputProps={{
                  startAdornment: <AssignmentIcon sx={{ color: 'text.secondary', mr: 1 }} />
                }}
              />
            </Grid>
            
            {/* Popis */}
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Popis projektu"
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={handleFormChange}
                disabled={formLoading}
                variant="outlined"
                placeholder="Detailní popis projektu, cílů a požadavků..."
                helperText="Popište účel projektu, hlavní cíle a očekávané výsledky"
              />
            </Grid>
            
            {/* Přiřazení a nastavení */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2, mt: 2 }}>
                Přiřazení a nastavení
              </Typography>
            </Grid>
            
            {/* Zodpovědná osoba */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={formLoading}>
                <InputLabel>Zodpovědná osoba</InputLabel>
                <Select
                  name="manager"
                  value={formData.manager}
                  onChange={handleFormChange}
                  label="Zodpovědná osoba"
                >
                  <MenuItem value="">
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                      <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                      <em>Zatím nepřiřazeno</em>
                    </Box>
                  </MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.uid} value={user.uid}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          src={user.photoURL || undefined} 
                          alt={user.displayName}
                          sx={{ width: 32, height: 32, mr: 2 }}
                        >
                          {user.displayName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" component="div">
                            {user.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.position}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Status projektu */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={formLoading}>
                <InputLabel>Status projektu</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status projektu"
                >
                  <MenuItem value="active">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: '#4CAF50', 
                        mr: 2 
                      }} />
                      Aktivní
                    </Box>
                  </MenuItem>
                  <MenuItem value="completed">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: '#2196F3', 
                        mr: 2 
                      }} />
                      Dokončený
                    </Box>
                  </MenuItem>
                  <MenuItem value="onHold">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: '#FFC107', 
                        mr: 2 
                      }} />
                      Pozastavený
                    </Box>
                  </MenuItem>
                  <MenuItem value="cancelled">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: '#F44336', 
                        mr: 2 
                      }} />
                      Zrušený
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Termín dokončení */}
            <Grid item xs={12} md={6}>
              <TextField
                name="deadline"
                label="Termín dokončení"
                type="date"
                fullWidth
                value={formData.deadline}
                onChange={handleFormChange}
                disabled={formLoading}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: <CalendarIcon sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                helperText="Plánovaný termín dokončení projektu"
              />
            </Grid>
            
            {/* Prázdný prostor pro symetrii */}
            <Grid item xs={12} md={6}>
              {/* Zde můžeme přidat další pole v budoucnu */}
            </Grid>
          </Grid>
        </DialogContent>
        
        <Divider />
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleFormClose} 
            disabled={formLoading}
            size="large"
          >
            Zrušit
          </Button>
          <Button 
            onClick={handleFormSubmit} 
            variant="contained" 
            color="primary"
            disabled={formLoading || !formData.name.trim()}
            size="large"
            startIcon={formLoading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {formLoading ? 'Ukládám...' : (selectedProject ? 'Uložit změny' : 'Vytvořit projekt')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects;