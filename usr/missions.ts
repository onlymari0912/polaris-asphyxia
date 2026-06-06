import { PolarisProfileData } from '../common/profile/types';
import { PolarisScoreAggregateData } from '../common/score/types';
import { AchievementRank, Rank } from '../common/score/enums';
import { toInt } from '../common/utils';

export function chartIdFromMusic(musicId: number, difficulty: number) {
  const parsedMusicId = toInt(musicId);
  const parsedDifficulty = toInt(difficulty);
  if (parsedMusicId <= 0 || parsedDifficulty < 0) {
    return 0;
  }

  return parsedMusicId * 10 + parsedDifficulty + 1;
}

const PA_TASK_LIKES_SHIFT = 0;
const PA_TASK_ACHIEVEMENT_RATE_SHIFT = 4;
const PA_TASK_MAX_COMBO_SHIFT = 8;
const PA_TASK_CLEAR_COUNT_SHIFT = 12;
const PA_TASK_NIBBLE_MASK = 0xF;

function clampPaTaskAchievement(value: number) {
  return Math.max(0, Math.min(PA_TASK_NIBBLE_MASK, toInt(value)));
}

function packPaTaskAchievement(
  likes: number,
  achievementRate: number,
  maxCombo: number,
  clearCount: number
) {
  return (
    (clampPaTaskAchievement(likes) << PA_TASK_LIKES_SHIFT) |
    (clampPaTaskAchievement(achievementRate) << PA_TASK_ACHIEVEMENT_RATE_SHIFT) |
    (clampPaTaskAchievement(maxCombo) << PA_TASK_MAX_COMBO_SHIFT) |
    (clampPaTaskAchievement(clearCount) << PA_TASK_CLEAR_COUNT_SHIFT)
  );
}

function rankToPaTaskAchievement(rank: number) {
  const value = toInt(rank);
  if (value >= Rank.SS) return 4;
  if (value >= Rank.S) return 3;
  if (value >= Rank.A) return 2;
  if (value >= Rank.B) return 1;
  return 0;
}

function achievementRateToRank(achievementRate: number) {
  const value = toInt(achievementRate);
  if (value <= 0) return -1;
  if (value < 7000) return 0;
  if (value < 8000) return 1;
  if (value < 8500) return 2;
  if (value < 9000) return 3;
  if (value < 9500) return AchievementRank.AA;
  if (value < 9800) return AchievementRank.AAA;
  if (value < 9850) return AchievementRank.S;
  if (value < 9900) return AchievementRank.SS;
  if (value < 9950) return 8;
  if (value < 10000) return 9;
  return 10;
}

function achievementRankToPaTaskAchievement(rank: number) {
  const value = toInt(rank);
  if (value >= AchievementRank.SS) return 4;
  if (value >= AchievementRank.S) return 3;
  if (value >= AchievementRank.AAA) return 2;
  if (value >= AchievementRank.AA) return 1;
  return 0;
}

function clearCountToPaTaskAchievement(clearCount: number) {
  const value = toInt(clearCount);
  if (value >= 10) return 4;
  if (value >= 6) return 3;
  if (value >= 3) return 2;
  if (value >= 1) return 1;
  return 0;
}

export function mergePaTaskAchievements(current: number, incoming: number) {
  const currentValue = toInt(current);
  const incomingValue = toInt(incoming);
  let merged = 0;

  for (const shift of [
    PA_TASK_LIKES_SHIFT,
    PA_TASK_ACHIEVEMENT_RATE_SHIFT,
    PA_TASK_MAX_COMBO_SHIFT,
    PA_TASK_CLEAR_COUNT_SHIFT,
  ]) {
    const currentNibble = (currentValue >> shift) & PA_TASK_NIBBLE_MASK;
    const incomingNibble = (incomingValue >> shift) & PA_TASK_NIBBLE_MASK;
    merged |= Math.max(currentNibble, incomingNibble) << shift;
  }

  return merged;
}

function paTaskAchievementFromScore(score: PolarisScoreAggregateData, totalClearCount: number) {
  return packPaTaskAchievement(
    rankToPaTaskAchievement(score.scoreRank),
    achievementRankToPaTaskAchievement(achievementRateToRank(score.achievementRate)),
    rankToPaTaskAchievement(score.comboRank),
    clearCountToPaTaskAchievement(totalClearCount)
  );
}

export function completeMusicMissionsFromScores(
  profile: PolarisProfileData,
  scores: PolarisScoreAggregateData[]
) {
  const achievementsByChart = new Map<number, number>();
  const totalClearCountByMusic = new Map<number, number>();
  const computedChartIds = new Set<number>();
  const order: number[] = [];

  for (const mission of profile.musicMissions || []) {
    const chartId = toInt(mission.chart_id);
    if (chartId <= 0) {
      continue;
    }
    if (!achievementsByChart.has(chartId)) {
      order.push(chartId);
      achievementsByChart.set(chartId, 0);
    }
    achievementsByChart.set(
      chartId,
      mergePaTaskAchievements(achievementsByChart.get(chartId) || 0, toInt(mission.achievements))
    );
  }

  for (const score of scores || []) {
    const musicId = toInt(score.musicId);
    if (musicId <= 0) {
      continue;
    }
    totalClearCountByMusic.set(
      musicId,
      toInt(totalClearCountByMusic.get(musicId)) + toInt(score.clearCount)
    );
  }

  for (const score of scores || []) {
    const chartId = chartIdFromMusic(score.musicId, score.difficulty);
    if (chartId <= 0) {
      continue;
    }
    if (!achievementsByChart.has(chartId)) {
      order.push(chartId);
      achievementsByChart.set(chartId, 0);
    }
    achievementsByChart.set(
      chartId,
      mergePaTaskAchievements(
        computedChartIds.has(chartId) ? achievementsByChart.get(chartId) || 0 : 0,
        paTaskAchievementFromScore(score, toInt(totalClearCountByMusic.get(toInt(score.musicId))))
      )
    );
    computedChartIds.add(chartId);
  }

  const nextMissions = order.map(chartId => ({
    chart_id: chartId,
    achievements: achievementsByChart.get(chartId) || 0,
  }));
  if (JSON.stringify(nextMissions) === JSON.stringify(profile.musicMissions || [])) {
    return false;
  }

  profile.musicMissions = nextMissions;
  return true;
}

export function replaceMusicMissions(
  profile: PolarisProfileData,
  missions: Record<string, string | number | boolean>[]
) {
  const latestByChart = new Map<number, number>();
  const order: number[] = [];

  for (const mission of profile.musicMissions || []) {
    const chartId = toInt(mission.chart_id);
    if (chartId <= 0) {
      continue;
    }
    if (!latestByChart.has(chartId)) {
      order.push(chartId);
    }
    latestByChart.set(chartId, mergePaTaskAchievements(toInt(latestByChart.get(chartId)), toInt(mission.achievements)));
  }

  for (const mission of missions || []) {
    const chartId = toInt(mission.chart_id);
    if (chartId <= 0) {
      continue;
    }
    if (!latestByChart.has(chartId)) {
      order.push(chartId);
    }
    latestByChart.set(chartId, mergePaTaskAchievements(toInt(latestByChart.get(chartId)), toInt(mission.achievements)));
  }

  profile.musicMissions = order.map(chartId => ({
    chart_id: chartId,
    achievements: latestByChart.get(chartId) || 0,
  }));
}

export function mergeExtendMusicMissions(
  profile: PolarisProfileData,
  missions: Record<string, string | number | boolean>[]
) {
  const ids = new Set<number>();
  for (const mission of profile.extendMusicMissions || []) {
    const id = toInt(mission.id);
    if (id > 0) {
      ids.add(id);
    }
  }
  for (const mission of missions || []) {
    const id = toInt(mission.id);
    if (id > 0) {
      ids.add(id);
    }
  }

  profile.extendMusicMissions = Array.from(ids)
    .sort((a, b) => a - b)
    .map(id => ({ id }));
}
