export interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'user';
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
}

export interface SearchProps {
  results: SearchResult[];
  isLoading: boolean;
  onResultClick: (result: SearchResult) => void;
  query: string;
}
