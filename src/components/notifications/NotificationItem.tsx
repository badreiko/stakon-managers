import React from 'react';
import { 
  ListItem, 
  ListItemAvatar, 
  Avatar, 
  ListItemText, 
  Typography, 
  Box,
  IconButton
} from '@mui/material';
import { 
  Assignment as TaskIcon, 
  Notifications as NotificationIcon, 
  Person as PersonIcon,
  MarkChatRead as MarkReadIcon
} from '@mui/icons-material';
import { Notification } from '../../context/NotificationContext';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (notification.type) {
      case 'task':
        return <TaskIcon />;
      case 'mention':
        return <PersonIcon />;
      default:
        return <NotificationIcon />;
    }
  };

  const getBackgroundColor = () => {
    return notification.read ? 'transparent' : 'rgba(255, 87, 34, 0.08)';
  };

  const handleClick = () => {
    if (notification.taskId) {
      navigate(`/tasks/${notification.taskId}`);
    }
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 48) {
      return 'Včera';
    } else {
      return format(date, 'dd.MM.yyyy', { locale: cs });
    }
  };

  return (
    <ListItem 
      alignItems="flex-start" 
      sx={{ 
        bgcolor: getBackgroundColor(),
        borderRadius: 1,
        mb: 0.5,
        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
        cursor: 'pointer'
      }}
      onClick={handleClick}
      secondaryAction={
        !notification.read && (
          <IconButton 
            edge="end" 
            aria-label="mark as read"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            size="small"
          >
            <MarkReadIcon fontSize="small" />
          </IconButton>
        )
      }
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: notification.read ? 'grey.400' : '#ff5722' }}>
          {getIcon()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography variant="subtitle2" component="div">
            {notification.title}
          </Typography>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary" component="span">
              {notification.message}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              component="div"
              sx={{ mt: 0.5 }}
            >
              {formatDate(notification.createdAt)}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
};

export default NotificationItem;
