import {
    PolarisIdentity,
    PolarisProfileData,
} from './types';
import {
    cleanProfileDocument,
    decodeDbDocument,
    decodeDbDocuments,
    encodeDbDocument,
} from '../db-codec';

const USR_ID_MIN = 100000;
const USR_ID_MAX = 999999;
const UUID_LOG_HISTORY_LIMIT = 300;

function normalizeUuidHistory(profile: Partial<PolarisProfileData> & Record<string, any>){
    const processedUuids = Array.isArray(profile.processedUuids) ? profile.processedUuids : [];
    const legacyActionLogs = Array.isArray(profile.actionLogs) ? profile.actionLogs : [];
    const legacyUuids = legacyActionLogs
        .map(log => `${log?.uuid || ''}`.trim())
        .filter(Boolean);

    return {
        ...profile,
        processedUuids: Array.from(new Set([...processedUuids, ...legacyUuids]))
            .filter(uuid => uuid.length > 0)
            .slice(-UUID_LOG_HISTORY_LIMIT),
        actionLogs: [],
    };
}

function defaultProfile(refId: string, printedCard: string, name: string, usrId: number){
    return {
        collection: 'profile',
        refId,
        printedCard,
        name,
        usrId,
        crewId: `${Math.floor(Math.random() * 100_000_000)}`.padStart(8, '0'),
        playInfo: {},
        mainOption: {},
        counts: {},
        actionCounts: {},
        decks: [],
        characterCards: [],
        characters: [],
        musicMissions: [],
        extendMusicMissions: [],
        paSkill: {},
        processedUuids: [],
        actionLogs: [],
    } as PolarisProfileData;
}

function randomUsrId(){
    return Math.floor(Math.random() * (USR_ID_MAX - USR_ID_MIN + 1)) + USR_ID_MIN;
}

async function allocateUsrId(){
    const tried = new Set<number>();
    for(let i = 0; i < 1000; i++){
        const candidate = randomUsrId();
        if(tried.has(candidate)){
            continue;
        }

        tried.add(candidate);
        if(!(await getProfileByUsrId(candidate))){
            return candidate;
        }
    }

    const used = new Set(((await getAllProfiles()) || []).map(profile => profile.usrId));
    for(let candidate = USR_ID_MIN; candidate <= USR_ID_MAX; candidate++){
        if(!used.has(candidate)){
            return candidate;
        }
    }

    throw new Error('No available Polaris usr_id');
}

export async function getProfileByRefId(refId: string){
    if(!refId){
        return null;
    }

    return decodeDbDocument((await DB.FindOne<PolarisProfileData>(refId, {
        collection: 'profile',
    })) as ProfileDoc<PolarisProfileData> | null);
}

export async function getProfileByUsrId(usrId: number){
    return decodeDbDocument((await DB.FindOne<PolarisProfileData>(null, {
        collection: 'profile',
        usrId,
    })) as ProfileDoc<PolarisProfileData> | null);
}

export async function getAllProfiles(){
    return decodeDbDocuments((await DB.Find<PolarisProfileData>(null, {
        collection: 'profile',
    })) as ProfileDoc<PolarisProfileData>[] | null);
}

export async function findProfileByCard(card: string){
    if(!card){
        return null;
    }

    const trimmed = card.trim();
    const profiles = (await getAllProfiles()) || [];
    return (
        profiles.find(
            profile =>
                (profile.printedCard || '') === card ||
                (profile.printedCard || '') === trimmed ||
                (profile.refId || '') === trimmed
        ) || null
    );
}

export async function findProfileByIdentity(identity: PolarisIdentity){
    const refId = identity.refId.trim();
    return refId ? await getProfileByRefId(refId) : null;
}

export async function ensureProfile(
    refId: string,
    printedCard: string,
    name: string
){
    const existing = await getProfileByRefId(refId);
    if(existing){
        const nextProfile = normalizeUuidHistory({
            ...existing,
            refId,
            printedCard: existing.printedCard || printedCard || '',
            name: existing.name || name || 'PLAYER',
        });

        await DB.Upsert<PolarisProfileData>(
            refId,
            {collection: 'profile'},
            encodeDbDocument(cleanProfileDocument(nextProfile))
        );
        return nextProfile as ProfileDoc<PolarisProfileData>;
    }

    const usrId = await allocateUsrId();
    const profile = defaultProfile(refId, printedCard || '', name || 'PLAYER', usrId);
    await DB.Upsert<PolarisProfileData>(
        refId,
        {collection: 'profile'},
        encodeDbDocument(cleanProfileDocument(profile))
    );
    return (await getProfileByRefId(refId)) as ProfileDoc<PolarisProfileData> | null;
}

export async function saveProfile(profile: PolarisProfileData){
    const refId = profile.refId;
    await DB.Upsert<PolarisProfileData>(
        refId,
        {collection: 'profile'},
        encodeDbDocument(cleanProfileDocument(normalizeUuidHistory({
            ...profile,
            refId,
        })))
    );
}
