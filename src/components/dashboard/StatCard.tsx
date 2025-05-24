import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  sx?: SxProps<Theme>;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'primary.main', sx }) => {
  return (
    <Card 
      elevation={2} 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: 4,
        borderColor: color,
        ...sx
      }}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Box sx={{ color }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" component="div" fontWeight="bold" mt={1}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatCard;
