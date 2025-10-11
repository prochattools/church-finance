export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  source: string;
  normalizedKey: string;
}

export interface ImportSummary {
  filename: string;
  importedCount: number;
  autoCategorized: number;
  reviewCount: number;
}
