import { toInt } from '../utils';

export enum ClearType {
  NoPlay = 0,
  GoodTry = 1,
  Success = 2,
  FullCombo = 3,
  AllPerfect = 4,
}

export enum NoteGrade {
  NOV = 0,
  ADV = 1,
  EXH = 2,
  INF = 3,
  MXM = 4,
  Max = 5,
  None = 6,
}

export enum Rank {
  NoData = 0,
  D = 3,
  C = 4,
  B = 5,
  A = 6,
  S = 7,
  SS = 8,
  Max = 9,
  None = -1,
}

export enum AchievementRank {
  NoData = -1,
  D = 0,
  C = 1,
  B = 2,
  A = 3,
  AA = 4,
  AAA = 5,
  S = 6,
  SS = 7,
  SSS = 8,
  SSSPlus = 9,
  SSSAP = 10,
}

export const PLAYABLE_NOTE_GRADES = [
  NoteGrade.NOV,
  NoteGrade.ADV,
  NoteGrade.EXH,
  NoteGrade.INF,
  NoteGrade.MXM,
] as const;

export function isClearSuccess(clearStatus?: number) {
  return toInt(clearStatus) >= ClearType.Success;
}

export function isFullCombo(clearStatus?: number) {
  return toInt(clearStatus) >= ClearType.FullCombo;
}

export function isAllPerfect(clearStatus?: number) {
  return toInt(clearStatus) >= ClearType.AllPerfect;
}
