import { completeMusicMissionsFromScores } from '../usr/missions';
import { buildProfileResponse } from '../usr/response';
import { consumeItem as consumeProfileItem, grantCharacterCard } from '../common/profile/inventory';
import { applyUsrSaveData } from '../usr/save';
import { getProfileByUsrId, saveProfile } from '../common/profile/repository';
import { getScoreAggregates } from '../common/score/repository';
import { PolarisProfileData } from '../common/profile/types';
import { formatDateTime, toInt } from '../common/utils';
import { DEFAULT_GACHA_ID, GACHA_BY_ID, getConsumeItem, resolveGachaId } from './catalog';
import { drawGachaCard } from './draw';
import {
  buildGachaDrawResponse,
  buildGachaEndResponse,
  buildGachaInfoResponse,
  buildGachaTransactionResponse,
} from './response';
import { consumeGachaTransaction, rememberGachaTransaction } from './transaction';

async function buildPlayerData(profile: PolarisProfileData | null) {
  if (!profile) {
    return {
      result: K.ITEM('s32', 1),
      now_date: K.ITEM('str', formatDateTime()),
    };
  }
  if (completeMusicMissionsFromScores(profile, (await getScoreAggregates(profile.refId)) || [])) {
    await saveProfile(profile);
  }
  return buildProfileResponse(profile);
}

export function getGachaInfo() {
  return buildGachaInfoResponse();
}

export async function beginGacha(data: any) {
  const body = $(data);
  const playerDataNode = body.element('player_data');
  const usrId = playerDataNode?.number('usr_id', -1) ?? -1;
  const profile = usrId >= 0 ? await getProfileByUsrId(usrId) : null;
  if (profile && playerDataNode) {
    applyUsrSaveData(profile, playerDataNode);
    completeMusicMissionsFromScores(profile, (await getScoreAggregates(profile.refId)) || []);
    await saveProfile(profile);
  }

  return buildGachaTransactionResponse();
}

export function drawGacha(data: any) {
  const body = $(data);
  const transactionId = body.str('transaction_id', '');
  const gachaId = resolveGachaId(body.number('gacha_id', DEFAULT_GACHA_ID));
  rememberGachaTransaction(transactionId, gachaId);
  return buildGachaDrawResponse();
}

export async function endGacha(data: any) {
  const body = $(data);
  const usrId = body.number('usr_id', -1);
  const transactionId = body.str('transaction_id', '');
  const gachaId = resolveGachaId(consumeGachaTransaction(transactionId, DEFAULT_GACHA_ID));
  const profile = usrId >= 0 ? await getProfileByUsrId(usrId) : null;
  const useItem = body.element('use_items')?.element('item');
  const consumeItem = getConsumeItem(GACHA_BY_ID.get(gachaId));

  if (
    !profile ||
    (
      !!useItem &&
      !!consumeItem.id &&
      consumeItem.count > 0 &&
      !consumeProfileItem(profile, consumeItem.id, consumeItem.count)
    )
  ) {
    return buildGachaEndResponse(
      null,
      await buildPlayerData(profile),
      1,
      'Item short balance'
    );
  }

  const card = drawGachaCard(gachaId);
  grantCharacterCard(profile, card.card_id);
  await saveProfile(profile);

  return buildGachaEndResponse(card, await buildPlayerData(profile));
}
