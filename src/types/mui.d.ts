declare module '@mui/material';
declare module '@mui/icons-material';
declare module '@mui/material/styles' {
  export interface Theme {
    palette: any;
    spacing: (factor: number) => string | number;
    shape: {
      borderRadius: number;
    };
    typography: any;
    zIndex: any;
    transitions: any;
    breakpoints: any;
  }
  
  export interface ThemeOptions {
    palette?: any;
    typography?: any;
    shape?: any;
    spacing?: any;
    breakpoints?: any;
    zIndex?: any;
    transitions?: any;
    components?: any;
  }
  
  export function createTheme(options?: ThemeOptions): Theme;
  export function useTheme(): Theme;
  export function ThemeProvider(props: { theme: Theme; children: React.ReactNode }): JSX.Element;
  export function styled(component: any): any;
  export function alpha(color: string, opacity: number): string;
  export function useThemeProps(props: any): any;
}

declare module '@mui/system' {
  export type SxProps<T> = any;
  export function shouldForwardProp(prop: string): boolean;
  export function experimental_sx(): any;
}

declare module '@mui/material/CssBaseline';
declare module '@mui/material/Button';
declare module '@mui/material/IconButton';
declare module '@mui/material/TextField';
declare module '@mui/material/FormControl';
declare module '@mui/material/InputLabel';
declare module '@mui/material/MenuItem';
declare module '@mui/material/MenuList';
declare module '@mui/material/Chip';
declare module '@mui/material/Paper';
declare module '@mui/material/Popper';
declare module '@mui/material/Grow';
declare module '@mui/material/Unstable_TrapFocus';
declare module '@mui/material/InputAdornment';
declare module '@mui/material/utils';
declare module '@mui/system/createStyled';
declare module 'react-beautiful-dnd' {
  export interface DraggableLocation {
    droppableId: string;
    index: number;
  }

  export interface DropResult {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    destination?: DraggableLocation;
    reason: 'DROP' | 'CANCEL';
    mode: 'FLUID' | 'SNAP';
  }

  export interface DroppableProvided {
    innerRef: (element: HTMLElement | null) => void;
    droppableProps: {
      'data-rbd-droppable-id': string;
      'data-rbd-droppable-context-id': string;
    };
    placeholder?: React.ReactElement | null;
  }

  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith?: string;
    draggingFromThisWith?: string;
    isUsingPlaceholder: boolean;
  }

  export interface DraggableProvided {
    draggableProps: {
      'data-rbd-draggable-context-id': string;
      'data-rbd-draggable-id': string;
      style?: React.CSSProperties;
    };
    dragHandleProps?: {
      'data-rbd-drag-handle-draggable-id': string;
      'data-rbd-drag-handle-context-id': string;
      'aria-labelledby': string;
      role: string;
      tabIndex: number;
      draggable: boolean;
      onDragStart: (event: React.DragEvent<HTMLElement>) => void;
    };
    innerRef: (element: HTMLElement | null) => void;
  }

  export interface DraggableStateSnapshot {
    isDragging: boolean;
    isDropAnimating: boolean;
    draggingOver?: string;
    dropAnimation?: {
      duration: number;
      curve: string;
      moveTo: {
        x: number;
        y: number;
      };
    };
    mode?: 'FLUID' | 'SNAP';
    combineWith?: string;
    combineTargetFor?: string;
  }

  export function Droppable(props: any): JSX.Element;
  export function Draggable(props: any): JSX.Element;
  export function DragDropContext(props: any): JSX.Element;
}
