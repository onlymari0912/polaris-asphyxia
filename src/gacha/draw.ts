import { toInt } from '../common/utils';
import { GACHA_BY_ID, GACHA_OPTIONS, getDrawableCards } from './catalog';
import { CharacterCard } from './types';

export function drawGachaCard(gachaId: number) {
  const entry = GACHA_BY_ID.get(gachaId);
  const drawableCards = getDrawableCards(gachaId);

  if (drawableCards.length === 0) {
    return {
      card_id: entry?.category === 'Snapshot' ? '00010001' : '00060001',
      rarity: 'R',
    };
  }

  const rarityWeights = GACHA_OPTIONS.rarity_weights_by_category?.[entry?.category || 'Contenter'] || {};
  const buckets = new Map<string, CharacterCard[]>();
  for (const card of drawableCards) {
    const bucket = buckets.get(card.rarity) || [];
    bucket.push(card);
    buckets.set(card.rarity, bucket);
  }

  const weightedRarities = Object.entries(rarityWeights)
    .map(([rarity, weight]) => [rarity, toInt(weight)] as [string, number])
    .filter(([rarity, weight]) => weight > 0 && (buckets.get(rarity)?.length || 0) > 0);
  let candidateCards = drawableCards;
  if (weightedRarities.length > 0) {
    const totalWeight = weightedRarities.reduce((sum, [, weight]) => sum + weight, 0);
    let threshold = Math.random() * totalWeight;
    for (const [rarity, weight] of weightedRarities) {
      threshold -= weight;
      if (threshold <= 0) {
        candidateCards = buckets.get(rarity) || drawableCards;
        break;
      }
    }
  }

  const pickupIds = new Set(entry?.pickups || []);
  const pickupCards = candidateCards.filter(card => pickupIds.has(card.card_id));
  const regularCards = candidateCards.filter(card => !pickupIds.has(card.card_id));
  const pickupRate = Math.min(1000, Math.max(0, toInt(GACHA_OPTIONS.pickup_rate_percent)));
  if (pickupCards.length > 0 && regularCards.length > 0) {
    candidateCards = Math.random() * 100 < pickupRate / 10 ? pickupCards : regularCards;
  }

  return candidateCards[Math.floor(Math.random() * candidateCards.length)] || drawableCards[0];
}
