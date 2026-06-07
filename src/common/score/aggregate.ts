import { PolarisScoreAggregateData, PolarisScoreLogData } from './types';
import {
  isAllPerfect,
  isClearSuccess,
  isFullCombo,
} from './enums';
import { toInt } from '../utils';

export function scoreKey(score: Pick<PolarisScoreAggregateData, 'musicId' | 'difficulty'>) {
  return `${score.musicId}:${score.difficulty}`;
}

export function aggregateFromLog(scoreLog: PolarisScoreLogData): PolarisScoreAggregateData {
  return {
    collection: 'score_aggregate',
    usrId: scoreLog.usrId,
    musicId: scoreLog.musicId,
    difficulty: scoreLog.difficulty,
    score: scoreLog.score,
    achievementRate: scoreLog.achievementRate,
    clearStatus: scoreLog.clearStatus,
    combo: scoreLog.combo,
    scoreRank: scoreLog.scoreRank,
    comboRank: scoreLog.comboRank,
    playCount: 1,
    clearCount: isClearSuccess(scoreLog.clearStatus) ? 1 : 0,
    perfectClearCount: isAllPerfect(scoreLog.clearStatus) ? 1 : 0,
    fullComboCount: isFullCombo(scoreLog.clearStatus) ? 1 : 0,
  };
}

export function mergeScoreAggregate(
  current: PolarisScoreAggregateData | null,
  scoreLog: PolarisScoreLogData
) {
  if (!current) {
    return aggregateFromLog(scoreLog);
  }

  return {
    ...current,
    score: Math.max(current.score, scoreLog.score),
    achievementRate: Math.max(current.achievementRate, scoreLog.achievementRate),
    clearStatus: Math.max(current.clearStatus, scoreLog.clearStatus),
    combo: Math.max(current.combo, scoreLog.combo),
    scoreRank: Math.max(current.scoreRank, scoreLog.scoreRank),
    comboRank: Math.max(current.comboRank, scoreLog.comboRank),
    playCount: current.playCount + 1,
    clearCount: toInt(current.clearCount) + (isClearSuccess(scoreLog.clearStatus) ? 1 : 0),
    perfectClearCount:
      toInt(current.perfectClearCount) + (isAllPerfect(scoreLog.clearStatus) ? 1 : 0),
    fullComboCount: toInt(current.fullComboCount) + (isFullCombo(scoreLog.clearStatus) ? 1 : 0),
  };
}

export function bestScoreMap(
  scoreLogs: PolarisScoreLogData[],
  scoreAggregates: PolarisScoreAggregateData[]
) {
  const bestScores = new Map<string, PolarisScoreAggregateData>();

  for (const aggregate of scoreAggregates) {
    bestScores.set(scoreKey(aggregate), {
      collection: 'score_aggregate',
      usrId: aggregate.usrId,
      musicId: aggregate.musicId,
      difficulty: aggregate.difficulty,
      score: aggregate.score,
      achievementRate: aggregate.achievementRate,
      clearStatus: aggregate.clearStatus,
      combo: aggregate.combo,
      scoreRank: aggregate.scoreRank,
      comboRank: aggregate.comboRank,
      playCount: aggregate.playCount,
      clearCount: toInt(aggregate.clearCount),
      perfectClearCount: toInt(aggregate.perfectClearCount),
      fullComboCount: toInt(aggregate.fullComboCount),
    });
  }

  for (const scoreLog of scoreLogs) {
    const key = scoreKey(scoreLog);
    if (!bestScores.has(key)) {
      bestScores.set(key, aggregateFromLog(scoreLog));
    }
  }

  return bestScores;
}
