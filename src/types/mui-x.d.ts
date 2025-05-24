declare module '@mui/x-data-grid' {
  export interface GridColDef {
    field: string;
    headerName?: string;
    width?: number;
    minWidth?: number;
    flex?: number;
    renderCell?: (params: GridRenderCellParams<any>) => React.ReactNode;
    valueFormatter?: (params: GridValueFormatterParams<any>) => string;
    sortable?: boolean;
    filterable?: boolean;
    disableColumnMenu?: boolean;
    align?: 'left' | 'right' | 'center';
    headerAlign?: 'left' | 'right' | 'center';
  }

  export interface GridRenderCellParams<T = any> {
    value: any;
    row: T;
    api: any;
    id: string;
    field: string;
    formattedValue: any;
  }

  export interface GridValueFormatterParams<T = any> {
    value: T;
    field: string;
    api: any;
    id: string;
  }

  export interface DataGridProps {
    rows: any[];
    columns: GridColDef[];
    loading?: boolean;
    checkboxSelection?: boolean;
    disableRowSelectionOnClick?: boolean;
    onRowSelectionModelChange?: (newSelection: any) => void;
    rowSelectionModel?: any[];
    getRowId?: (row: any) => string;
    autoHeight?: boolean;
    density?: 'compact' | 'standard' | 'comfortable';
    initialState?: any;
    pageSize?: number;
    rowsPerPageOptions?: number[];
    pageSizeOptions?: number[];
    pagination?: boolean;
    paginationMode?: 'client' | 'server';
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    page?: number;
    hideFooter?: boolean;
    hideFooterPagination?: boolean;
    hideFooterSelectedRowCount?: boolean;
    components?: any;
    componentsProps?: any;
    localeText?: any;
    error?: any;
    onError?: (error: any) => void;
    onRowClick?: (params: any) => void;
    onRowDoubleClick?: (params: any) => void;
    onCellClick?: (params: any) => void;
    onCellDoubleClick?: (params: any) => void;
    onCellKeyDown?: (params: any) => void;
    onCellFocusOut?: (params: any) => void;
    onColumnHeaderClick?: (params: any) => void;
    onColumnHeaderDoubleClick?: (params: any) => void;
    onColumnHeaderOver?: (params: any) => void;
    onColumnHeaderOut?: (params: any) => void;
    onColumnHeaderEnter?: (params: any) => void;
    onColumnHeaderLeave?: (params: any) => void;
    onColumnOrderChange?: (params: any) => void;
    onColumnResize?: (params: any) => void;
    onColumnVisibilityChange?: (params: any) => void;
    onColumnWidthChange?: (params: any) => void;
    onFilterModelChange?: (params: any) => void;
    onSelectionModelChange?: (params: any) => void;
    onSortModelChange?: (params: any) => void;
    onStateChange?: (params: any) => void;
  }

  export const DataGrid: React.ComponentType<DataGridProps>;
}
