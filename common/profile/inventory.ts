import { randomUUID } from 'crypto';
import { PolarisProfileData } from './types';
import { formatDateTime, toInt } from '../utils';

function itemKey(itemId: string) {
  return itemId.trim();
}

export function itemMap(profile: PolarisProfileData) {
  return new Map(
    (profile.items || [])
      .filter(item => `${item.item_id || ''}`.trim())
      .map(item => [`${item.item_id || ''}`.trim(), { ...item }])
  );
}

export function writeItems(profile: PolarisProfileData, map: Map<string, Record<string, string | number>>) {
  profile.items = Array.from(map.values()).filter(item => toInt(item.count) > 0);
}

export function getItemCount(profile: PolarisProfileData | null, itemId: string) {
  if (!profile) {
    return 0;
  }

  const current = itemMap(profile).get(itemKey(itemId));
  return Math.max(0, toInt(current?.count));
}

export function setItemCount(profile: PolarisProfileData, itemId: string, count: number) {
  const key = itemKey(itemId);
  if (!key) {
    return;
  }

  const map = itemMap(profile);
  const nextCount = Math.max(0, toInt(count));
  if (nextCount > 0) {
    map.set(key, {
      ...(map.get(key) || {}),
      item_id: key,
      count: nextCount,
    });
  } else {
    map.delete(key);
  }
  writeItems(profile, map);
}

export function changeItemCount(profile: PolarisProfileData, itemId: string, change: number) {
  setItemCount(profile, itemId, getItemCount(profile, itemId) + toInt(change));
}

export function consumeItem(profile: PolarisProfileData | null, itemId: string, count: number) {
  const key = itemKey(itemId);
  const amount = toInt(count);
  if (!profile || !key || amount <= 0) {
    return false;
  }

  const current = getItemCount(profile, key);
  if (current < amount) {
    return false;
  }

  setItemCount(profile, key, current - amount);
  return true;
}

export function grantCharacterCard(profile: PolarisProfileData, cardId: string) {
  profile.characterCards = [...(profile.characterCards || [])];
  profile.characterCards.push({
    index: randomUUID(),
    item_id: `chara_card.${cardId}`,
    card_limit_over_count: 0,
    character_card_exp: 0,
    character_card_skill_exp: 0,
    additional_skills: [],
    is_favorite: false,
    source: 0,
    deleted: false,
    created_at: formatDateTime(),
  });
}
