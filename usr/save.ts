import { randomUUID } from 'crypto';
import { PolarisProfileData } from '../common/profile/types';
import {
  readScalarChildren,
  scalarValue,
  toBool,
  toInt,
} from '../common/utils';
import {
  MAIN_OPTION_BOOL_FIELDS,
  MAIN_OPTION_INT_FIELDS,
  PLAY_INFO_COUNTER_FIELDS,
  PLAY_INFO_INT_FIELDS,
  PRIVACY_INT_FIELDS,
  SORT_SETTING_INT_FIELDS,
  USR_PROFILE_BOOL_FIELDS,
  USR_PROFILE_INT_FIELDS,
} from './profile-fields';
import { itemMap, writeItems } from '../common/profile/inventory';
import { mergeExtendMusicMissions, replaceMusicMissions } from './missions';

const MAX_PROFILE_LEVEL_VALUE = 999999999;
const MAX_ITEM_COUNT = 999999999;
const MAX_ITEM_CHANGE = 999999999;
const MAX_COUNTER_VALUE = 999999999;
const MAX_TEXT_LENGTH = 128;
const MAX_COMMENT_LENGTH = 256;
const UUID_LOG_HISTORY_LIMIT = 300;
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function applyGamePlayDelta(playInfo: Record<string, string | number | boolean>, delta: number) {
  if (delta <= 0) {
    return;
  }

  const modeId = toInt(playInfo.mode_id);
  const modeField = ({
    10: 'standard_play_count',
    20: 'freetime4_play_count',
    21: 'freetime6_play_count',
    22: 'freetime8_play_count',
    23: 'freetime12_play_count',
    30: 'local_matching_play_count',
    40: 'global_matching_play_count',
  } as Record<number, string>)[modeId];

  if (modeField) {
    playInfo[modeField] = clampInt(toInt(playInfo[modeField]) + delta, 0, MAX_COUNTER_VALUE);
  }
  if ([20, 21, 22, 23].includes(modeId)) {
    playInfo.freetime_play_count = clampInt(
      toInt(playInfo.freetime_play_count) + delta,
      0,
      MAX_COUNTER_VALUE
    );
  }
}

function readAdditionalSkills(card: KDataReader) {
  return (card.element('additional_skills')?.elements('skill_id') || [])
    .map(skill => scalarValue(skill.obj))
    .filter(value => isSafeId(value));
}

function processedUuidHistory(profile: PolarisProfileData) {
  const legacyActionUuids = ((profile as any).actionLogs || [])
    .map((log: Record<string, unknown>) => `${log?.uuid || ''}`.trim())
    .filter(Boolean);
  const processedUuids = (profile.processedUuids || [])
    .map(uuid => `${uuid || ''}`.trim())
    .filter(Boolean);

  return Array.from(new Set([...processedUuids, ...legacyActionUuids])).slice(-UUID_LOG_HISTORY_LIMIT);
}

function rememberUuid(history: string[], seen: Set<string>, uuid: string) {
  if (!isSafeUuid(uuid) || seen.has(uuid)) {
    return;
  }
  seen.add(uuid);
  history.push(uuid);
  while (history.length > UUID_LOG_HISTORY_LIMIT) {
    const dropped = history.shift();
    if (dropped && !history.includes(dropped)) {
      seen.delete(dropped);
    }
  }
}

function clampInt(value: unknown, min = 0, max = MAX_COUNTER_VALUE, fallback = 0) {
  return Math.min(max, Math.max(min, toInt(value, fallback)));
}

function safeText(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  return `${value ?? ''}`.replace(/[\x00-\x1F\x7F]/g, '').slice(0, maxLength);
}

function isSafeId(value: unknown) {
  const text = `${value ?? ''}`.trim();
  return text.length > 0 && text.length <= 128 && /^[0-9A-Za-z_.:-]+$/.test(text);
}

function isSafeUuid(value: unknown) {
  const text = `${value ?? ''}`.trim();
  return text.length > 0 && text.length <= 128 && /^[0-9A-Za-z_.:-]+$/.test(text);
}

function isClientPersistableItemId(itemId: string) {
  return isSafeId(itemId);
}

function mergeCharacterCards(
  profile: PolarisProfileData,
  cards: KDataReader[]
) {
  const existingByIndex = new Map<string, Record<string, any>>(
    (profile.characterCards || [])
      .filter(card => isGuid(card.index))
      .filter(card => !toBool(card.deleted))
      .filter(card => isSafeId(card.item_id))
      .map(card => [`${card.index}`, { ...card }])
  );

  for (const card of cards) {
    const index = card.str('index', '').trim();
    if (!isGuid(index)) {
      continue;
    }

    const existing = existingByIndex.get(index);
    if (toBool(card.number('deleted', 0))) {
      existingByIndex.delete(index);
      continue;
    }

    const incomingItemId = card.str('item_id', `${existing?.item_id || ''}`).trim();
    const itemId = isSafeId(incomingItemId) ? incomingItemId : `${existing?.item_id || ''}`;
    if (!isSafeId(itemId)) {
      continue;
    }

    existingByIndex.set(index, {
      ...existing,
      index,
      item_id: itemId,
      card_limit_over_count: clampInt(card.number('card_limit_over_count', toInt(existing?.card_limit_over_count)), 0, MAX_PROFILE_LEVEL_VALUE),
      character_card_exp: clampInt(card.number('character_card_exp', toInt(existing?.character_card_exp)), 0, MAX_PROFILE_LEVEL_VALUE),
      character_card_skill_exp: clampInt(card.number('character_card_skill_exp', toInt(existing?.character_card_skill_exp)), 0, MAX_PROFILE_LEVEL_VALUE),
      additional_skills: readAdditionalSkills(card),
      is_favorite: toBool(card.number('is_favorite', toBool(existing?.is_favorite) ? 1 : 0)),
      source: clampInt(card.number('source', toInt(existing?.source)), 0, MAX_PROFILE_LEVEL_VALUE),
      deleted: false,
      created_at: safeText(existing?.created_at || card.str('created_at', ''), MAX_TEXT_LENGTH),
    });
  }

  profile.characterCards = Array.from(existingByIndex.values());
}

function isGuid(value: unknown) {
  return GUID_PATTERN.test(`${value ?? ''}`.trim());
}

function sanitizeDeckCardIndex(value: unknown) {
  const index = `${value ?? ''}`.trim();
  return isGuid(index) ? index : randomUUID();
}

function sanitizeDecks(profile: PolarisProfileData) {
  profile.decks = (profile.decks || []).map(deck => ({
    ...deck,
    contenter_index: sanitizeDeckCardIndex(deck.contenter_index),
    supportsnap1_index: sanitizeDeckCardIndex(deck.supportsnap1_index),
    supportsnap2_index: sanitizeDeckCardIndex(deck.supportsnap2_index),
    supportsnap3_index: sanitizeDeckCardIndex(deck.supportsnap3_index),
    supportsnap4_index: sanitizeDeckCardIndex(deck.supportsnap4_index),
  }));
}

export function applyUsrSaveData(profile: PolarisProfileData | null, root: KDataReader | null) {
  if (!profile || !root) {
    return false;
  }

  profile.playInfo = { ...(profile.playInfo || {}) };
  profile.mainOption = { ...(profile.mainOption || {}) };
  profile.privacy = { ...(profile.privacy || {}) };
  profile.nametag = { ...(profile.nametag || {}) };
  profile.sortSetting = { ...(profile.sortSetting || {}) };
  profile.counts = { ...(profile.counts || {}) };
  profile.actionCounts = { ...(profile.actionCounts || {}) };
  const processedUuids = processedUuidHistory(profile);
  const uuidSet = new Set(processedUuids);
  profile.processedUuids = processedUuids;
  (profile as any).actionLogs = [];
  profile.unlockMusic = [];
  profile.items = [...(profile.items || [])];
  profile.nameTitles = [...(profile.nameTitles || [])];
  profile.decks = [...(profile.decks || [])];
  profile.characterCards = [...(profile.characterCards || [])];
  profile.characters = [...(profile.characters || [])];
  profile.musicMissions = [...(profile.musicMissions || [])];
  profile.extendMusicMissions = [...(profile.extendMusicMissions || [])];
  profile.paSkill = { ...(profile.paSkill || {}) };

  const gachaTicketNode = root.element('gacha_ticket_received');
  if (gachaTicketNode) {
    profile.gachaTicketReceived = clampInt(
      scalarValue(gachaTicketNode.obj),
      0,
      1,
      toInt(profile.gachaTicketReceived)
    );
  }

  const usrProfile = readScalarChildren(
    root.element('usr_profile'),
    USR_PROFILE_INT_FIELDS,
    USR_PROFILE_BOOL_FIELDS
  );
  if ('usr_name' in usrProfile) profile.name = safeText(usrProfile.usr_name, MAX_TEXT_LENGTH) || profile.name;
  if ('usr_rank' in usrProfile) {
    profile.rank = clampInt(usrProfile.usr_rank, 0, MAX_PROFILE_LEVEL_VALUE, profile.rank);
  }
  if ('exp' in usrProfile) profile.exp = clampInt(usrProfile.exp, 0, MAX_PROFILE_LEVEL_VALUE, profile.exp);
  if ('comment' in usrProfile) profile.comment = safeText(usrProfile.comment, MAX_COMMENT_LENGTH);
  if ('is_tutorial_cleared' in usrProfile) {
    profile.isTutorialCleared = toBool(usrProfile.is_tutorial_cleared) ? 1 : 0;
  }

  const playInfo = readScalarChildren(root.element('usr_play_info'), PLAY_INFO_INT_FIELDS);
  for (const [key, value] of Object.entries(playInfo)) {
    if (PLAY_INFO_COUNTER_FIELDS.has(key)) {
      profile.playInfo[key] = Math.max(
        clampInt(profile.playInfo[key], 0, MAX_COUNTER_VALUE),
        clampInt(value, 0, MAX_COUNTER_VALUE)
      );
    } else {
      profile.playInfo[key] = typeof value === 'number' ? clampInt(value, 0, MAX_COUNTER_VALUE) : value;
    }
  }

  profile.mainOption = {
    ...profile.mainOption,
    ...readScalarChildren(root.element('usr_main_option'), MAIN_OPTION_INT_FIELDS, MAIN_OPTION_BOOL_FIELDS),
  };
  profile.privacy = {
    ...profile.privacy,
    ...readScalarChildren(root.element('usr_privacy'), PRIVACY_INT_FIELDS),
  };
  profile.nametag = {
    ...profile.nametag,
    ...readScalarChildren(root.element('usr_nametag')),
  };
  profile.sortSetting = {
    ...profile.sortSetting,
    ...readScalarChildren(root.element('usr_sort_setting'), SORT_SETTING_INT_FIELDS),
  };

  const map = itemMap(profile);
  for (const item of root.element('usr_item')?.elements('item') || []) {
    const itemId = item.str('item_id', '').trim();
    const existing = map.get(itemId);
    if (!isClientPersistableItemId(itemId)) {
      continue;
    }
    const count = clampInt(item.number('count', toInt(existing?.count)), 0, MAX_ITEM_COUNT);
    if (count <= 0) {
      map.delete(itemId);
      continue;
    }
    map.set(itemId, {
      ...existing,
      item_id: itemId,
      count,
      income: clampInt(item.number('income', toInt(existing?.income)), 0, MAX_ITEM_COUNT),
      expense: clampInt(item.number('expense', toInt(existing?.expense)), 0, MAX_ITEM_COUNT),
      item_type: clampInt(item.number('item_type', toInt(existing?.item_type)), 0, MAX_PROFILE_LEVEL_VALUE),
      is_new: clampInt(item.number('is_new', toInt(existing?.is_new)), 0, 1),
      limit_date: safeText(item.str('limit_date', `${existing?.limit_date || ''}`), MAX_TEXT_LENGTH),
      remain_time: clampInt(item.number('remain_time', toInt(existing?.remain_time)), 0, MAX_COUNTER_VALUE),
      param: clampInt(item.number('param', toInt(existing?.param)), 0, MAX_PROFILE_LEVEL_VALUE),
    });
  }

  for (const item of root.element('usr_item_change_log')?.elements('item') || []) {
    const uuid = item.str('uuid', '').trim();
    if (uuid && uuidSet.has(uuid)) {
      continue;
    }
    const id = item.str('item_id', '').trim();
    const change = clampInt(item.number('change_count', 0), -MAX_ITEM_CHANGE, MAX_ITEM_CHANGE);
    if (isSafeUuid(uuid) && isClientPersistableItemId(id) && change !== 0) {
      const current = toInt(map.get(id)?.count);
      const next = clampInt(current + change, 0, MAX_ITEM_COUNT);
      if (next > 0) {
        map.set(id, {
          ...(map.get(id) || {}),
          item_id: id,
          count: next,
        });
      } else {
        map.delete(id);
      }
      rememberUuid(processedUuids, uuidSet, uuid);
    }
  }
  writeItems(profile, map);

  const titles = new Set(profile.nameTitles || []);
  for (const title of root.element('usr_name_titles')?.elements('title') || []) {
    const value = scalarValue(title.obj);
    if (isSafeId(value)) {
      titles.add(value);
    }
  }
  profile.nameTitles = Array.from(titles);

  const decks = root.element('usr_deck')?.elements('deck') || [];
  if (decks.length > 0) {
    profile.decks = decks.map(deck =>
      ({
        ...readScalarChildren(deck, new Set(['deck_number']), new Set(['is_main', 'is_select'])),
        deck_name: safeText(deck.str('deck_name', 'DECK 1'), MAX_TEXT_LENGTH),
        contenter_index: sanitizeDeckCardIndex(deck.str('contenter_index', '')),
        supportsnap1_index: sanitizeDeckCardIndex(deck.str('supportsnap1_index', '')),
        supportsnap2_index: sanitizeDeckCardIndex(deck.str('supportsnap2_index', '')),
        supportsnap3_index: sanitizeDeckCardIndex(deck.str('supportsnap3_index', '')),
        supportsnap4_index: sanitizeDeckCardIndex(deck.str('supportsnap4_index', '')),
        frame_id: isSafeId(deck.str('frame_id', '')) ? deck.str('frame_id', '') : '',
        pose_id: isSafeId(deck.str('pose_id', '')) ? deck.str('pose_id', '') : '',
        another_costume_id: isSafeId(deck.str('another_costume_id', '')) ? deck.str('another_costume_id', '') : '',
      })
    );
  }

  const characterCards = root.element('usr_character_card')?.elements('card') || [];
  if (characterCards.length > 0) {
    mergeCharacterCards(profile, characterCards);
  }
  sanitizeDecks(profile);

  const characters = root.element('usr_character')?.elements('chara') || [];
  if (characters.length > 0) {
    const existingCharacters = new Map(
      (profile.characters || [])
        .filter(character => isSafeId(character.chara_id))
        .map(character => [`${character.chara_id}`, { ...character }])
    );
    for (const character of characters) {
      const charaId = character.str('chara_id', '').trim();
      const existing = existingCharacters.get(charaId);
      if (!existing) {
        continue;
      }
      existingCharacters.set(charaId, {
        ...existing,
        chara_id: charaId,
        closeness: clampInt(character.number('closeness', toInt(existing.closeness)), 0, MAX_PROFILE_LEVEL_VALUE),
        home_touch_count: clampInt(character.number('home_touch_count', toInt(existing.home_touch_count)), 0, MAX_COUNTER_VALUE),
      });
    }
    profile.characters = Array.from(existingCharacters.values());
  }

  const missions = root.element('usr_music_mission')?.elements('music_mission') || [];
  if (missions.length > 0) {
    replaceMusicMissions(profile, missions.map(mission => readScalarChildren(mission)));
  }

  const extendMissions = root.element('usr_extend_music_mission')?.elements('extend_music_mission') || [];
  if (extendMissions.length > 0) {
    mergeExtendMusicMissions(profile, extendMissions.map(mission => readScalarChildren(mission)));
  }

  const paSkill = root.element('pa_skill');
  if (paSkill) {
    profile.paSkill = {
      pa_skill_history: (paSkill.element('pa_skill_history')?.elements('data') || [])
        .map(data => clampInt(scalarValue(data.obj), 0, MAX_PROFILE_LEVEL_VALUE))
        .filter(value => value > 0),
      pa_skill_history_index: clampInt(paSkill.number('pa_skill_history_index', 0), 0, MAX_PROFILE_LEVEL_VALUE),
      skill: clampInt(paSkill.number('skill', 0), 0, MAX_PROFILE_LEVEL_VALUE),
      charts: (paSkill.element('charts')?.elements('chart') || [])
        .filter(chart => chart.number('music_id', 0) > 0 && chart.number('chart_difficulty_type', 0) >= 0)
        .map(chart => ({
          rank: clampInt(chart.number('rank', 0), 0, MAX_PROFILE_LEVEL_VALUE),
          music_id: chart.number('music_id', 0),
          chart_difficulty_type: chart.number('chart_difficulty_type', 0),
          skill: clampInt(chart.number('skill', 0), 0, MAX_PROFILE_LEVEL_VALUE),
        })),
    };
  }

  let gamePlayDelta = 0;
  for (const action of root.element('usr_action_count_change_log')?.elements('action_log') || []) {
    const uuid = action.str('uuid', '').trim();
    if (uuid && uuidSet.has(uuid)) {
      continue;
    }

    const key = action.str('key', '').trim();
    const change = clampInt(action.number('change_count', 0), -MAX_COUNTER_VALUE, MAX_COUNTER_VALUE);
    if (!isSafeId(key) || change === 0) {
      continue;
    }

    profile.counts[key] = clampInt(toInt(profile.counts[key]) + change, 0, MAX_COUNTER_VALUE);
    profile.actionCounts[key] = clampInt(toInt(profile.actionCounts[key]) + change, 0, MAX_COUNTER_VALUE);
    rememberUuid(processedUuids, uuidSet, uuid);
    if (key === 'game_play_count') {
      gamePlayDelta += change;
    }
  }

  for (const count of root.element('usr_count')?.elements('count') || []) {
    const key = count.str('key', '');
    if (isSafeId(key)) {
      profile.counts[key] = clampInt(count.number('value', toInt(profile.counts[key])), 0, MAX_COUNTER_VALUE);
    }
  }

  for (const actionCount of root.element('usr_action_count')?.elements('action_count') || []) {
    const key = actionCount.str('key', '');
    if (isSafeId(key)) {
      profile.actionCounts[key] = clampInt(actionCount.number('count', toInt(profile.actionCounts[key])), 0, MAX_COUNTER_VALUE);
    }
  }

  for (const actionCount of root.element('usr_max_action_count')?.elements('action_count') || []) {
    const key = actionCount.str('key', '');
    if (isSafeId(key)) {
      profile.actionCounts[key] = Math.max(
        clampInt(profile.actionCounts[key], 0, MAX_COUNTER_VALUE),
        clampInt(actionCount.number('count', 0), 0, MAX_COUNTER_VALUE)
      );
    }
  }

  applyGamePlayDelta(profile.playInfo, gamePlayDelta);
  profile.processedUuids = processedUuids.slice(-UUID_LOG_HISTORY_LIMIT);
  (profile as any).actionLogs = [];
  return true;
}
