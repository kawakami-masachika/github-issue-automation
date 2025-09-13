import { CSVRow, IssueData } from '../types';

export function parseLabels(labelsString: string): string[] {
  if (!labelsString || !labelsString.trim()) {
    return [];
  }

  return labelsString
    .split(',')
    .map(label => label.trim())
    .filter(label => label.length > 0);
}

export function csvRowToIssueData(csvRow: CSVRow): IssueData {
  return {
    title: csvRow.title,
    labels: parseLabels(csvRow.labels || ''),
    overview: csvRow.overview || undefined,
    ref: csvRow.ref || undefined,
    background: csvRow.background || undefined,
    goals: csvRow.goals || undefined,
    acceptanceCriteria: csvRow.acceptanceCriteria || undefined,
    notes: csvRow.notes || undefined,
    outOfScope: csvRow.outOfScope || undefined,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
