import { cleanProfileDocument } from '../db-codec';
import { PolarisScoreAggregateData, PolarisScoreLogData } from './types';

export async function getScoreAggregates(refId: string) {
  return (await DB.Find<PolarisScoreAggregateData>(refId, {
    collection: 'score_aggregate',
  } as any)) as ProfileDoc<PolarisScoreAggregateData>[] | null;
}

export async function getScoreLogs(refId: string) {
  return (await DB.Find<PolarisScoreLogData>(refId, {
    collection: 'score_log',
  } as any)) as ProfileDoc<PolarisScoreLogData>[] | null;
}

export async function insertScoreLog(refId: string, scoreLog: PolarisScoreLogData) {
  await DB.Insert<PolarisScoreLogData>(refId, cleanProfileDocument({
    ...scoreLog,
  } as any));
}

export async function saveScoreAggregate(refId: string, aggregate: PolarisScoreAggregateData) {
  await DB.Upsert<PolarisScoreAggregateData>(
    refId,
    {
      collection: 'score_aggregate',
      musicId: aggregate.musicId,
      difficulty: aggregate.difficulty,
    } as any,
    cleanProfileDocument({
      ...aggregate,
    } as any)
  );
}
