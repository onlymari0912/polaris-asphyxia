import {
    ensureProfile,
    findProfileByIdentity,
    getProfileByUsrId,
    saveProfile,
} from '../common/profile/repository';
import {
    getScoreAggregates,
    getScoreLogs,
    insertScoreLog,
    saveScoreAggregate,
} from '../common/score/repository';
import {readPolarisIdentity} from '../common/profile/identity';
import {bestScoreMap, mergeScoreAggregate, scoreKey} from '../common/score/aggregate';
import {PolarisProfileData} from '../common/profile/types';
import {PolarisScoreAggregateData, PolarisScoreLogData} from '../common/score/types';
import {formatDateTime, toInt} from '../common/utils';
import {completeMusicMissionsFromScores} from './missions';
import {
    buildProfileResponse,
    buildUsrMusicHighscoreResponse,
    normalizeCrewId,
} from './response';
import {applyUsrSaveData} from './save';

export type UsrServiceResult = {
    denied?: boolean;
    payload?: Record<string, unknown>;
};

function ok(payload: Record<string, unknown> = {}): UsrServiceResult{
    return {payload};
}

function deny(): UsrServiceResult{
    return {denied: true};
}

function normalizeExistingProfile(
    existing: PolarisProfileData,
    refId: string,
    printedCard: string,
    name: string
){
    return {
        collection: 'profile',
        refId,
        printedCard: existing.printedCard || printedCard,
        name: existing.name || name,
        usrId: existing.usrId,
        crewId: existing.crewId,
        version: existing.version || {},
        rank: existing.rank,
        exp: existing.exp,
        comment: existing.comment,
        gachaTicketReceived: existing.gachaTicketReceived,
        tutorialSkipped: existing.tutorialSkipped,
        isTutorialCleared: existing.isTutorialCleared,
        playInfo: existing.playInfo || {},
        mainOption: existing.mainOption || {},
        privacy: existing.privacy || {},
        nametag: existing.nametag || {},
        sortSetting: existing.sortSetting || {},
        unlockMusic: existing.unlockMusic || [],
        items: existing.items || [],
        nameTitles: existing.nameTitles || [],
        decks: existing.decks || [],
        characterCards: existing.characterCards || [],
        characters: existing.characters || [],
        musicMissions: existing.musicMissions || [],
        extendMusicMissions: existing.extendMusicMissions || [],
        paSkill: existing.paSkill || {},
        counts: existing.counts || {},
        actionCounts: existing.actionCounts || {},
        processedUuids: Array.from(new Set([
            ...(existing.processedUuids || []),
            ...((existing.actionLogs || []).map(log => `${log.uuid || ''}`).filter(Boolean)),
        ])).slice(-300),
        actionLogs: [],
    } as PolarisProfileData;
}

export async function signUpUser(data: any){
    const body = $(data);
    const identity = readPolarisIdentity(body);
    if(!identity.refId){
        return deny();
    }

    const storageRefId = identity.refId;
    const existing = await findProfileByIdentity(identity);
    const printedCard = `${existing?.printedCard || identity.cardId}`;
    const profileName = `${body.str('usr_name', 'PLAYER') || 'PLAYER'}`;
    const profile = existing || (await ensureProfile(storageRefId, printedCard, profileName));

    if(existing){
        await saveProfile(normalizeExistingProfile(existing, storageRefId, printedCard, profileName));
    }

    return ok({
        usr_id: K.ITEM('s32', toInt(profile?.usrId)),
        crew_id: K.ITEM('str', normalizeCrewId(profile?.crewId)),
    });
}

export async function getUser(data: any){
    const body = $(data);
    const profile = await findProfileByIdentity(readPolarisIdentity(body));

    if(!profile || !profile.name){
        return ok({
            result: K.ITEM('s32', 1),
        });
    }

    const scoreAggregates = (await getScoreAggregates(profile.refId)) || [];
    if(completeMusicMissionsFromScores(profile, scoreAggregates)){
        await saveProfile(profile);
    }

    return ok(buildProfileResponse(profile));
}

export async function saveUser(data: any){
    const body = $(data);
    const usrId = body.number('usr_id', -1);
    if(usrId < 0){
        return deny();
    }

    const currentProfile = await getProfileByUsrId(usrId);
    if(currentProfile){
        const profile = {
            ...currentProfile,
        } as PolarisProfileData;

        applyUsrSaveData(profile, body);
        completeMusicMissionsFromScores(profile, (await getScoreAggregates(profile.refId)) || []);
        await saveProfile(profile);
    }

    return ok({
        now_date: K.ITEM('str', formatDateTime()),
    });
}

export async function getUserMusic(data: any){
    const body = $(data);
    const usrId = body.number('usr_id', -1);
    const profile = usrId >= 0 ? await getProfileByUsrId(usrId) : null;
    const scoreLogs = profile ? (await getScoreLogs(profile.refId)) || [] : [];
    const scoreAggregates = profile ? (await getScoreAggregates(profile.refId)) || [] : [];

    return ok(buildUsrMusicHighscoreResponse(bestScoreMap(scoreLogs, scoreAggregates)));
}

export async function saveMusicScore(data: any){
    const body = $(data);
    const usrId = body.number('usr_id', -1);
    const profile = usrId >= 0 ? await getProfileByUsrId(usrId) : null;

    if(profile){
        const currentAggregates = ((await getScoreAggregates(profile.refId)) || []).map(
            aggregate => [scoreKey(aggregate), aggregate as PolarisScoreAggregateData] as [
                string,
                PolarisScoreAggregateData,
            ]
        );
        const aggregateMap = new Map<string, PolarisScoreAggregateData>(currentAggregates);

        for(const music of body.element('usr_music_play_log')?.elements('music') || []){
            const scoreLog = {
                collection: 'score_log',
                usrId,
                musicId: music.number('music_id', 0),
                difficulty: music.number('chart_difficulty_type', 0),
                score: music.number('score', 0),
                clearStatus: music.number('clear_status', 0),
                combo: music.number('combo', 0),
                achievementRate: music.number('achievement_rate', 0),
                scoreRank: music.number('score_rank', 0),
                comboRank: music.number('combo_rank', 0),
                timestamp: Date.now(),
            } as PolarisScoreLogData;

            await insertScoreLog(profile.refId, scoreLog);

            const key = scoreKey(scoreLog);
            const nextAggregate = mergeScoreAggregate(aggregateMap.get(key) || null, scoreLog);
            aggregateMap.set(key, nextAggregate);
            await saveScoreAggregate(profile.refId, nextAggregate);
        }

        if(completeMusicMissionsFromScores(profile, Array.from(aggregateMap.values()))){
            await saveProfile(profile);
        }
    }

    return ok({
        now_date: K.ITEM('str', formatDateTime()),
    });
}

export function emptyUsrResponse(){
    return ok({});
}
