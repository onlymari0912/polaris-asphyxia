import { randomUUID } from 'crypto';
import { formatDateTime, toInt } from '../common/utils';
import {
  GACHA_ENTRIES,
  GACHA_RESULT_RARITY_PARAMS,
  getConsumeItem,
  getGachaPaymentType,
} from './catalog';
import { CharacterCard } from './types';

export function buildGachaInfoResponse() {
  return {
    gacha_list: {
      gacha: GACHA_ENTRIES.map(entry => {
        const consumeItem = getConsumeItem(entry);
        const clientCardId = entry.category === 'Snapshot' ? '00010001' : '00060001';
        return {
          gacha_id: K.ITEM('s32', toInt(entry.id)),
          name: K.ITEM('str', `${entry.category || 'Gacha'} Hunt ${entry.id}`),
          payment_type: K.ITEM('s32', getGachaPaymentType(entry)),
          prob_weight_r: K.ITEM('s32', 0),
          prob_weight_sr: K.ITEM('s32', 0),
          prob_weight_ssr: K.ITEM('s32', 0),
          prob_weight_pickup: K.ITEM('s32', 0),
          guarantee_serial_limit: K.ITEM('s32', 0),
          gacha_consume_item_id: K.ITEM('str', consumeItem.id),
          gacha_consume_item_count: K.ITEM('s32', consumeItem.count),
          open_at: K.ITEM('str', '2026-01-01 00:00:00'),
          close_at: K.ITEM('str', '2040-12-31 14:59:59'),
          start_softcode: K.ITEM('str', '0000000000'),
          end_softcode: K.ITEM('str', '9999999999'),
          drawable_item_type: K.ITEM('s32', 0),
          items: {
            item: {
              item_id: K.ITEM('str', `chara_card.${clientCardId}`),
              rarity_type: K.ITEM('s32', 0),
              is_pickup: K.ITEM('s32', 0),
            },
          },
        };
      }),
    },
  };
}

export function buildGachaTransactionResponse(transactionId = randomUUID()) {
  return {
    now_date: K.ITEM('str', formatDateTime()),
    transaction_id: K.ITEM('str', transactionId),
    error: {
      code: K.ITEM('s32', 0),
      message: K.ITEM('str', ''),
    },
  };
}

export function buildGachaDrawResponse() {
  return {
    error: {
      code: K.ITEM('s32', 0),
      message: K.ITEM('str', ''),
    },
  };
}

export function buildGachaEndResponse(
  card: CharacterCard | null,
  playerData: Record<string, unknown>,
  errorCode = 0,
  errorMessage = ''
) {
  return {
    gacha_result: {
      items: card
        ? {
            item: K.ITEM('str', `chara_card.${card.card_id}`),
          }
        : {},
      item_counts: card
        ? {
            count: K.ITEM('s32', 1),
          }
        : {},
      item_params: card
        ? {
            param: K.ITEM('str', GACHA_RESULT_RARITY_PARAMS[card.rarity] || ''),
          }
        : {},
      error: {
        code: K.ITEM('s32', errorCode),
        message: K.ITEM('str', errorMessage),
      },
    },
    player_data: playerData,
  };
}
