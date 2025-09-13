import { GitHubLabel } from '../types';

export class LabelValidator {
  private repositoryLabels: Map<string, GitHubLabel>;

  constructor(labels: GitHubLabel[]) {
    this.repositoryLabels = new Map();
    labels.forEach(label => {
      this.repositoryLabels.set(label.name.toLowerCase(), label);
    });
  }

  validateLabels(labels: string[]): ValidationResult {
    const validLabels: string[] = [];
    const invalidLabels: string[] = [];

    labels.forEach(label => {
      const trimmedLabel = label.trim();
      if (this.repositoryLabels.has(trimmedLabel.toLowerCase())) {
        validLabels.push(trimmedLabel);
      } else {
        invalidLabels.push(trimmedLabel);
      }
    });

    return {
      isValid: invalidLabels.length === 0,
      validLabels,
      invalidLabels,
    };
  }

  getAvailableLabels(): string[] {
    return Array.from(this.repositoryLabels.keys());
  }
}

export type  ValidationResult = {
  isValid: boolean;
  validLabels: string[];
  invalidLabels: string[];
}
