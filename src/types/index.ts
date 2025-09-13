export type IssueData = {
  title: string;
  labels?: string[];
  overview?: string;
  ref?: string;
  background?: string;
  goals?: string;
  acceptanceCriteria?: string;
  notes?: string;
  outOfScope?: string;
};

export type CSVRow = {
  title: string;
  labels?: string;
  overview?: string;
  ref?: string;
  background?: string;
  goals?: string;
  acceptanceCriteria?: string;
  notes?: string;
  outOfScope?: string;
};

export type GitHubLabel = {
  id: number;
  name: string;
  color: string;
  description?: string;
};
