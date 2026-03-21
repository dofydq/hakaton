import { User, Question, Section, AppTest, Result, Option } from './index';

export interface ReportConfig {
  show_table: boolean;
  show_chart: boolean;
  show_interpretation: boolean;
}

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'psychologist' | 'client';
  full_name?: string;
  phone?: string;
  bio_markdown?: string;
  avatar_url?: string;
  access_until?: string | null;
  is_active: boolean;
}

export interface Option {
  id: string;
  text: string;
  points?: number;
  weight?: number;
}

export interface Question {
  id: string;
  type: 'text' | 'number' | 'single_choice' | 'multiple_choice' | 'scale' | 'slider';
  title?: string;
  text?: string;
  description?: string;
  isRequired?: boolean;
  options?: Option[];
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  questions?: Question[];
}

export interface AppTest {
  id: number;
  title: string;
  description?: string;
  is_active: boolean;
  logic_tree_json?: Section[];
  report_config?: ReportConfig;
}

export interface Result {
  id: string;
  test_id: number;
  client_fio: string;
  total_points: number;
  created_at: string;
  test_snapshot?: any;
}
