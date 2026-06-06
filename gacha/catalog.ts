import {readFileSync} from 'fs';
import {join} from 'path';
import {toInt} from '../common/utils';
import {CharacterCard, GachaCategory, GachaEntry, GachaOptions} from './types';

const RESOURCES_DIR = join(__dirname, '..', 'resources');
const PAYMENT_TYPE_FALLBACK_TO_CLIENT = 0;
const PAYMENT_TYPE_BY_TOKEN: Record<string, number> = {
    credit: 2,
    paseli: 4,
    item: 8,
};

export const GACHA_RESULT_RARITY_PARAMS: Record<string, string> = {
    N: '1',
    R: '2',
    SR: '3',
    SSR: '4',
};

function readJson<T>(name: string, fallback: T): T{
    try{
        return JSON.parse(readFileSync(join(RESOURCES_DIR, name), 'utf8')) as T;
    }catch{
        return fallback;
    }
}

function parseCsvLine(line: string){
    const values: string[] = [];
    let current = '';
    let quoted = false;

    for(let index = 0; index < line.length; index++){
        const char = line[index];
        if(char === '"'){
            if(quoted && line[index + 1] === '"'){
                current += '"';
                index += 1;
            }else{
                quoted = !quoted;
            }
        }else if(char === ',' && !quoted){
            values.push(current);
            current = '';
        }else{
            current += char;
        }
    }

    values.push(current);
    return values;
}

function readCards(){
    try{
        const lines = readFileSync(join(RESOURCES_DIR, 'cards.csv'), 'utf8')
            .replace(/^\uFEFF/, '')
            .split(/\r?\n/)
            .filter(Boolean);
        const headers = parseCsvLine(lines.shift() || '');
        return lines.map(line => {
            const values = parseCsvLine(line);
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            return {
                card_id: row.Id,
                rarity: row.Rarity,
            } as CharacterCard;
        });
    }catch{
        return [] as CharacterCard[];
    }
}

function loadGachaEntries(){
    const contenter = readJson<GachaEntry[]>('gacha_contenter.json', []).map(entry => ({
        ...entry,
        category: 'Contenter',
    }));
    const snapshot = readJson<GachaEntry[]>('gacha_snapshot.json', []).map(entry => ({
        ...entry,
        category: 'Snapshot',
    }));
    return [...contenter, ...snapshot].filter(entry => Number.isFinite(toInt(entry.id)));
}

const CHARACTER_CARDS = readCards();
const CHARACTER_CARD_BY_ID = new Map(CHARACTER_CARDS.map(card => [card.card_id, card]));

export const GACHA_ENTRIES = loadGachaEntries();
export const GACHA_BY_ID = new Map(GACHA_ENTRIES.map(entry => [toInt(entry.id), entry]));
export const DEFAULT_GACHA_ID = GACHA_ENTRIES.length > 0 ? toInt(GACHA_ENTRIES[0].id) : 0;
export const GACHA_OPTIONS = readJson<GachaOptions>('gacha_options.json', {});

export function resolveGachaId(gachaId: number){
    return GACHA_BY_ID.has(gachaId) ? gachaId : DEFAULT_GACHA_ID;
}

export function getConsumeItem(entry?: GachaEntry){
    const consumeItem = entry?.consume_item || {};
    return {
        id: `${consumeItem.id || ''}`.trim(),
        count: Math.max(0, toInt(consumeItem.count)),
    };
}

export function getGachaPaymentType(entry: GachaEntry){
    const paymentType = entry.payment_type;
    if(typeof paymentType === 'number'){
        return paymentType;
    }
    if(Array.isArray(paymentType)){
        return paymentType.reduce(
            (flags, token) => flags | (PAYMENT_TYPE_BY_TOKEN[`${token}`.trim().toLowerCase()] || 0),
            0
        );
    }
    return PAYMENT_TYPE_FALLBACK_TO_CLIENT;
}

export function getDrawableCards(gachaId: number){
    const entry = GACHA_BY_ID.get(gachaId);
    return (entry?.items || [])
        .map(cardId => CHARACTER_CARD_BY_ID.get(cardId))
        .filter((card): card is CharacterCard => !!card);
}
