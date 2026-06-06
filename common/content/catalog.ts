import {readFileSync} from 'fs';
import {join} from 'path';

const RESOURCES_DIR = join(__dirname, '..', '..', 'resources');

export type MusicCatalogEntry = {
    id: number;
    title: string;
    composer: string;
    noteGrades: number[];
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

function chartDifficulty(chart: unknown){
    if(typeof chart === 'number'){
        return chart;
    }
    if(chart && typeof chart === 'object'){
        const data = chart as Record<string, unknown>;
        return Number(data.difficulty ?? data.chartDifficultyType ?? data.noteGrade);
    }
    return NaN;
}

function normalizeMusicCatalog(data: unknown): MusicCatalogEntry[]{
    if(!Array.isArray(data)){
        return [];
    }

    return data
        .map(entry => {
            if(Array.isArray(entry)){
                return {
                    id: Number(entry[0]),
                    title: '',
                    composer: '',
                    noteGrades: Array.isArray(entry[1]) ? entry[1].map(chartDifficulty) : [],
                };
            }

            const music = entry as Record<string, unknown>;
            const rawNoteGrades = Array.isArray(music.noteGrades) ? music.noteGrades : [];

            return {
                id: Number(music.id),
                title: `${music.title ?? ''}`,
                composer: `${music.composer ?? ''}`,
                noteGrades: rawNoteGrades.map(chartDifficulty),
            };
        })
        .filter(entry => Number.isFinite(entry.id))
        .map(entry => ({
            id: entry.id,
            title: entry.title,
            composer: entry.composer,
            noteGrades: Array.from(new Set(entry.noteGrades.filter(Number.isFinite))).sort((a, b) => a - b),
        }))
        .filter(entry => entry.noteGrades.length > 0)
        .sort((a, b) => a.id - b.id);
}

function readCharacterCardItemIds(){
    try{
        const lines = readFileSync(join(RESOURCES_DIR, 'cards.csv'), 'utf8')
            .replace(/^\uFEFF/, '')
            .split(/\r?\n/)
            .filter(Boolean);
        const headers = parseCsvLine(lines.shift() || '');
        const idIndex = headers.indexOf('Id');
        if(idIndex < 0){
            return [];
        }

        return lines
            .map(line => parseCsvLine(line)[idIndex] || '')
            .map(id => `chara_card.${id.trim()}`)
            .filter(itemId => itemId !== 'chara_card.');
    }catch{
        return [];
    }
}

export const MUSIC_CATALOG = normalizeMusicCatalog(readJson<unknown>('musics.json', {}));
export const MUSIC_CHARTS = MUSIC_CATALOG.flatMap(music =>
    music.noteGrades.map(noteGrade => [music.id, noteGrade] as [number, number])
);
const CHARACTER_CARD_ITEM_IDS = new Set(readCharacterCardItemIds());