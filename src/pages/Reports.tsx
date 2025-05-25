import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CircularProgress 
} from '@mui/material';
import { 
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { startOfMonth, endOfMonth } from 'date-fns';
import { getTasks } from '../services/taskService';
import { getUsers } from '../services/userService';
import { getAllProjects } from '../services/projectService';
import { Task } from '../types/task.types';
import { User } from '../types/user.types';
import { Project } from '../types/project.types';
import StatCard from '../components/dashboard/StatCard';
import TaskStatusChart from '../components/reports/TaskStatusChart';
import TasksByAssigneeChart from '../components/reports/TasksByAssigneeChart';
import ProjectsTable from '../components/reports/ProjectsTable';

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fetchedTasksData, fetchedUsers, fetchedProjects] = await Promise.all([
          getTasks(),
          getUsers(),
          getAllProjects()
        ]);
        
        // getTasks возвращает объект { tasks, lastDoc }, а не просто массив задач
        setTasks(fetchedTasksData.tasks || []);
        setUsers(fetchedUsers || []);
        setProjects(fetchedProjects || []);
        
        console.log('Fetched data for reports:', {
          tasks: fetchedTasksData.tasks?.length || 0,
          users: fetchedUsers?.length || 0,
          projects: fetchedProjects?.length || 0
        });
      } catch (error) {
        console.error('Error fetching reports data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Вычисляем метрики
  const metrics = useMemo(() => {
    const completedTasks = tasks.filter(task => task.status === 'done');
    const overdueTasks = tasks.filter(task => 
      task.status !== 'done' && new Date(task.deadline) < new Date()
    );
    
    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      activeProjects: projects.filter(p => p.status === 'active').length
    };
  }, [tasks, projects]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Přehledy a statistiky
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Přehled výkonnosti týmu a projektů
        </Typography>
      </Box>

      {/* Rychlé metriky */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Celkem úkolů"
            value={metrics.totalTasks}
            icon={<AssignmentIcon />}
            color="#2196F3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Dokončeno"
            value={metrics.completedTasks}
            icon={<CheckCircleIcon />}
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Po termínu"
            value={metrics.overdueTasks}
            icon={<WarningIcon />}
            color="#F44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Úspěšnost"
            value={`${Math.round(metrics.completionRate)}%`}
            icon={<TrendingUpIcon />}
            color="#FF9800"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Graf úkolů podle statusu */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Úkoly podle statusu
              </Typography>
              <TaskStatusChart tasks={tasks} />
            </CardContent>
          </Card>
        </Grid>

        {/* Graf úkolů podle členů týmu */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Úkoly podle řešitele
              </Typography>
              <TasksByAssigneeChart tasks={tasks} users={users} />
            </CardContent>
          </Card>
        </Grid>

        {/* Tabulka projektů */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Přehled projektů
              </Typography>
              <ProjectsTable projects={projects} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Reports;
