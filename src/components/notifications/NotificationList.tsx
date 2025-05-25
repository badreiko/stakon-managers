import React from 'react';
import { 
  List, 
  Typography, 
  Box, 
  Button, 
  Divider,
  Paper
} from '@mui/material';
import NotificationItem from './NotificationItem';
import { useNotifications } from '../../context/NotificationContext';
import { useTranslation } from 'react-i18next';

interface NotificationListProps {
  onClose: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <Paper sx={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {t('notifications.title')}
        </Typography>
        {notifications.length > 0 && (
          <Button 
            size="small" 
            onClick={handleMarkAllAsRead}
            color="primary"
          >
            {t('notifications.markAllAsRead')}
          </Button>
        )}
      </Box>
      <Divider />
      {notifications.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('notifications.noNotifications')}
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 1 }}>
          {notifications.map((notification) => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </List>
      )}
    </Paper>
  );
};

export default NotificationList;
