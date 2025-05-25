import React, { useState, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { keyframes } from '@emotion/react';

// Список строительной техники с эмодзи и названиями
const constructionVehicles = [
  // Транспорт
  { emoji: '🚜', name: 'Traktor' },
  { emoji: '🚛', name: 'Nákladní auto' },
  { emoji: '🏗️', name: 'Jeřáb' },
  { emoji: '🚚', name: 'Sklápěč' },
  { emoji: '🚧', name: 'Bariéra' },
  { emoji: '🚑', name: 'Ambulance' },
  { emoji: '🚒', name: 'Hasičské auto' },
  { emoji: '🚓', name: 'Policejní auto' },
  { emoji: '🚕', name: 'Taxi' },
  { emoji: '🚐', name: 'Dodávka' },
  
  // Инструменты
  { emoji: '⚒️', name: 'Nářadí' },
  { emoji: '🛠️', name: 'Klíče' },
  { emoji: '🔨', name: 'Kladivo' },
  { emoji: '🪚', name: 'Pila' },
  { emoji: '🪓', name: 'Sekera' },
  { emoji: '🔧', name: 'Klíč' },
  { emoji: '🔩', name: 'Šroub a matice' },
  { emoji: '⚙️', name: 'Ozubené kolo' },
  { emoji: '🧰', name: 'Nářadí' },
  { emoji: '🧲', name: 'Magnet' },
  
  // Строительные материалы и объекты
  { emoji: '🧱', name: 'Cihla' },
  { emoji: '🪵', name: 'Dřevo' },
  { emoji: '🪨', name: 'Kámen' },
  { emoji: '🔌', name: 'Zástrčka' },
  { emoji: '💡', name: 'Žárovka' },
  { emoji: '🧯', name: 'Hasicí přístroj' },
  { emoji: '🪜', name: 'Žebřík' },
  { emoji: '🧹', name: 'Koště' },
  { emoji: '🧺', name: 'Koš' },
  { emoji: '🧬', name: 'DNA' }
];

// Создаем анимацию движения справа налево
const moveRightToLeft = keyframes`
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
`;

// Создаем анимацию движения слева направо
const moveLeftToRight = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

// Создаем анимацию подпрыгивания
const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;

// Создаем анимацию вращения
const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

interface VehicleProps {
  emoji: string;
  name: string;
  index: number;
  totalVehicles: number;
  reverse?: boolean;
}

// Компонент для отдельного транспортного средства
const Vehicle: React.FC<VehicleProps> = ({ emoji, name, index, totalVehicles, reverse = false }) => {
  const theme = useTheme();
  
  // Выбираем тип анимации в зависимости от индекса
  const getAnimation = () => {
    const animationType = index % 3;
    switch (animationType) {
      case 0:
        return bounce;
      case 1:
        return rotate;
      default:
        return 'none';
    }
  };

  // Рассчитываем задержку анимации для каждого транспорта
  const delay = `${index * (20 / totalVehicles)}s`;
  
  // Рассчитываем продолжительность анимации
  const duration = '30s';
  
  // Выбираем направление движения
  const movementAnimation = reverse ? moveLeftToRight : moveRightToLeft;
  
  return (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        mx: 1,
        position: 'relative',
        animation: `${movementAnimation} ${duration} linear infinite`,
        animationDelay: delay,
      }}
    >
      <Box
        sx={{
          fontSize: '1.5rem',
          animation: getAnimation() !== 'none' ? `${getAnimation()} 2s ease-in-out infinite` : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))',
        }}
      >
        {emoji}
      </Box>
    </Box>
  );
};

const ConstructionVehicles: React.FC = () => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  
  // Переключаем видимость каждые 60 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible((prev) => !prev);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <Box
      sx={{
        overflow: 'hidden',
        width: '100%',
        height: '40px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        opacity: 0.7,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          position: 'absolute',
          width: '100%',
        }}
      >
        {constructionVehicles.map((vehicle, index) => (
          <Vehicle
            key={index}
            emoji={vehicle.emoji}
            name={vehicle.name}
            index={index}
            totalVehicles={constructionVehicles.length}
          />
        ))}
      </Box>
    </Box>
  );
};

export default ConstructionVehicles;
