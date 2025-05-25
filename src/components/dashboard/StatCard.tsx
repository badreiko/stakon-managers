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
      elevation={1} 
      sx={{ 
        height: '40px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        borderLeft: 3,
        borderColor: color,
        borderRadius: 1,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: 2,
        },
        width: '100%',
        ...sx
      }}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', p: 1, py: 0.5, '&:last-child': { pb: 0.5 } }}>
        <Box sx={{ color, backgroundColor: `${color}15`, borderRadius: '50%', p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, width: 24, height: 24, minWidth: 24 }}>
          {icon}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1 }}>
            {title}
          </Typography>
          <Typography variant="body1" component="div" fontWeight="bold" sx={{ ml: 1 }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
