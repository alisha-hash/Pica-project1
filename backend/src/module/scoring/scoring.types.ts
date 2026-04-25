import type { ColorBand, InsightRule, RiskType } from '@prisma/client';

// ── Per finding (1–2 per pillar) ──────────────────────────
export interface ScoringFinding {
  optionId: string;
  questionText: string;
  selectedLabel: string;
  observation: string;
  recommendation: string;
  riskType: RiskType;
  score: number;
}

// ── Per pillar ─────────────────────────────────────────────
export interface ScoringPillarPayload {
  pillarId: string;
  pillarName: string; // ← ADDED: human-readable name e.g. "Founder & Leadership"
  pillarCode: string; // ← ADDED: short code e.g. "FL"
  rawScore: number;
  maxPossibleScore: number;
  weightedScore: number;
  hasKnockout: boolean;
  colorBand: ColorBand;
  insightRuleApplied: InsightRule;
  findings: ScoringFinding[];
}

// ── Overall result ─────────────────────────────────────────
export interface ScoringResultPayload {
  totalScore: number;
  colorBand: ColorBand;
  hasAnyKnockout: boolean;
  knockoutQuestionIds: string[];
  pillarScores: ScoringPillarPayload[];
}
