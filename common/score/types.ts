export interface PolarisScoreLogData {
  collection: 'score_log';
  usrId: number;
  musicId: number;
  difficulty: number;
  score: number;
  clearStatus: number;
  combo: number;
  achievementRate: number;
  scoreRank: number;
  comboRank: number;
  timestamp: number;
}

export interface PolarisScoreAggregateData {
  collection: 'score_aggregate';
  usrId: number;
  musicId: number;
  difficulty: number;
  score: number;
  achievementRate: number;
  clearStatus: number;
  combo: number;
  scoreRank: number;
  comboRank: number;
  playCount: number;
  clearCount: number;
  perfectClearCount: number;
  fullComboCount: number;
}
