export interface IssueData {
  title: string;
  labels?: string[];
  overview?: string;
  ref?: string;
  background?: string;
  goals?: string;
  acceptanceCriteria?: string;
  notes?: string;
  outOfScope?: string;
}

export interface CSVRow {
  title: string;
  labels?: string;
  overview?: string;
  ref?: string;
  background?: string;
  goals?: string;
  acceptanceCriteria?: string;
  notes?: string;
  outOfScope?: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}
