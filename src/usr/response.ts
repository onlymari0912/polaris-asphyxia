import {MUSIC_CHARTS} from '../common/content/catalog';
import {PolarisProfileData} from '../common/profile/types';
import {PolarisScoreAggregateData} from '../common/score/types';
import {
    formatDateTime,
    toBool,
    toInt,
} from '../common/utils';

const DEFAULT_DECK_CARD_INDEXES = {
    contenter: '8613079a-c349-abaf-12ac-328a6fadfd65',
    supportsnap1: 'cda9c7bd-6602-29e7-ef57-6d3b4ebf0768',
    supportsnap2: '04059182-61ec-b0e6-0624-1ad3d8e50fcb',
    supportsnap3: '309a03f9-0490-2267-95f4-be4ad3f01792',
    supportsnap4: '8c4a6938-9d7c-8755-0f27-24a919412d6f',
};
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function deckCardIndex(value: unknown, fallback: string){
    const index = `${value ?? ''}`.trim();
    return GUID_PATTERN.test(index) ? index : fallback;
}

function buildCountEntries(counts: Record<string, number>){
    const entries = Object.entries(counts);
    if(entries.length === 0){
        return {};
    }

    return {
        count: entries.map(([key, value]) => ({
            key: K.ITEM('str', key),
            value: K.ITEM('s32', toInt(value)),
        })),
    };
}

function buildActionCountEntries(counts: Record<string, number>){
    const entries = Object.entries(counts);
    if(entries.length === 0){
        return {};
    }

    return {
        action_count: entries.map(([key, value]) => ({
            key: K.ITEM('str', key),
            count: K.ITEM('s32', toInt(value)),
        })),
    };
}

function buildItemEntries(items: Record<string, string | number>[]){
    return items
        .filter(item => `${item.item_id || ''}`.trim())
        .map(item => ({
            item_id: K.ITEM('str', `${item.item_id || ''}`),
            count: K.ITEM('s32', toInt(item.count, 1)),
            income: K.ITEM('s32', toInt(item.income)),
            expense: K.ITEM('s32', toInt(item.expense)),
        }));
}

function shouldUnlockAllSongs(){
    return U.GetConfig('unlock_all_songs') !== false;
}

function buildUnlockAllSongItemEntries(){
    if(!shouldUnlockAllSongs()){
        return [];
    }

    return MUSIC_CHARTS.map(([musicId, chartDifficultyType]) => ({
        item_id: K.ITEM('str', `chart.${musicId}.${chartDifficultyType}`),
        count: K.ITEM('s32', 1),
        income: K.ITEM('s32', 0),
        expense: K.ITEM('s32', 0),
    }));
}

function buildNameTitleEntries(titles: string[]){
    if(titles.length === 0){
        return {};
    }

    return {
        title: titles.map(title => K.ITEM('str', title)),
    };
}

function buildMusicMissionEntries(missions: Record<string, string | number | boolean>[]){
    if(missions.length === 0){
        return {};
    }

    return {
        music_mission: missions.map(mission => ({
            chart_id: K.ITEM('s32', toInt(mission.chart_id)),
            achievements: K.ITEM('s32', toInt(mission.achievements)),
        })),
    };
}

function buildExtendMusicMissionEntries(missions: Record<string, string | number | boolean>[]){
    if(missions.length === 0){
        return {};
    }

    return {
        extend_music_mission: missions
            .filter(mission => toInt(mission.id) > 0)
            .map(mission => ({
                id: K.ITEM('s32', toInt(mission.id)),
            })),
    };
}

function buildPaSkillEntries(paSkill: Record<string, any>){
    return {
        pa_skill_history: {
            data: Array.isArray(paSkill.pa_skill_history)
                ? paSkill.pa_skill_history.map((value: unknown) => K.ITEM('s64', BigInt(toInt(value))))
                : [],
        },
        pa_skill_history_index: K.ITEM('s32', toInt(paSkill.pa_skill_history_index)),
        skill: K.ITEM('s32', toInt(paSkill.skill)),
        charts: {
            chart: Array.isArray(paSkill.charts)
                ? paSkill.charts.map((chart: Record<string, unknown>) => ({
                    rank: K.ITEM('s32', toInt(chart.rank)),
                    music_id: K.ITEM('s32', toInt(chart.music_id)),
                    chart_difficulty_type: K.ITEM('s32', toInt(chart.chart_difficulty_type)),
                    skill: K.ITEM('s32', toInt(chart.skill)),
                }))
                : [],
        },
    };
}

function buildCharacterCardEntries(cards: Record<string, string | number | boolean | string[]>[]){
    if(cards.length === 0){
        return {};
    }

    return {
        card: cards
            .filter(card => !toBool(card.deleted))
            .map(card => ({
                index: K.ITEM('str', `${card.index || ''}`),
                item_id: K.ITEM('str', `${card.item_id || ''}`),
                card_limit_over_count: K.ITEM('s32', toInt(card.card_limit_over_count)),
                character_card_exp: K.ITEM('s32', toInt(card.character_card_exp)),
                character_card_skill_exp: K.ITEM('s32', toInt(card.character_card_skill_exp)),
                additional_skills: {
                    skill_id: Array.isArray(card.additional_skills)
                        ? card.additional_skills.map(skillId => K.ITEM('str', `${skillId}`))
                        : [],
                },
                is_favorite: K.ITEM('bool', toBool(card.is_favorite)),
                source: K.ITEM('s32', toInt(card.source)),
                deleted: K.ITEM('bool', false),
                created_at: K.ITEM('str', `${card.created_at || formatDateTime()}`),
            })),
    };
}

function buildCharacterEntries(characters: Record<string, string | number>[]){
    if(characters.length === 0){
        return {};
    }

    return {
        chara: characters.map(character => ({
            chara_id: K.ITEM('str', `${character.chara_id || ''}`),
            closeness: K.ITEM('s32', toInt(character.closeness)),
            home_touch_count: K.ITEM('s32', toInt(character.home_touch_count)),
        })),
    };
}

export function normalizeCrewId(value: unknown){
    const digits = `${value ?? ''}`.replace(/\D/g, '');
    if(!digits){
        return '00000000';
    }
    return digits.length > 8 ? digits.slice(-8) : digits.padStart(8, '0');
}

export function buildUsrMusicHighscoreResponse(bestScores: Map<string, PolarisScoreAggregateData>){
    return {
        usr_music_highscore:
            bestScores.size === 0
                ? {}
                : {
                    music: Array.from(bestScores.values()).map(score => ({
                        music_id: K.ITEM('s32', score.musicId),
                        chart_difficulty_type: K.ITEM('s32', score.difficulty),
                        achievement_rate: K.ITEM('s32', score.achievementRate),
                        highscore: K.ITEM('s32', score.score),
                        score_rank: K.ITEM('s32', score.scoreRank),
                        maxcombo: K.ITEM('s32', score.combo),
                        combo_rank: K.ITEM('s32', score.comboRank),
                        clear_status: K.ITEM('s32', score.clearStatus),
                        play_count: K.ITEM('s32', score.playCount),
                        clear_count: K.ITEM('s32', score.clearCount),
                        perfect_clear_count: K.ITEM('s32', score.perfectClearCount),
                        full_combo_count: K.ITEM('s32', score.fullComboCount),
                    })),
                },
    };
}

function buildDeckEntries(decks: Record<string, string | number | boolean>[]){
    if(decks.length === 0){
        return {};
    }

    return {
        deck: decks.map(deck => ({
            deck_number: K.ITEM('s32', toInt(deck.deck_number)),
            is_main: K.ITEM('bool', toBool(deck.is_main)),
            is_select: K.ITEM('bool', toBool(deck.is_select)),
            deck_name: K.ITEM('str', `${deck.deck_name || 'DECK 1'}`),
            contenter_index: K.ITEM('str', deckCardIndex(deck.contenter_index, DEFAULT_DECK_CARD_INDEXES.contenter)),
            supportsnap1_index: K.ITEM('str', deckCardIndex(deck.supportsnap1_index, DEFAULT_DECK_CARD_INDEXES.supportsnap1)),
            supportsnap2_index: K.ITEM('str', deckCardIndex(deck.supportsnap2_index, DEFAULT_DECK_CARD_INDEXES.supportsnap2)),
            supportsnap3_index: K.ITEM('str', deckCardIndex(deck.supportsnap3_index, DEFAULT_DECK_CARD_INDEXES.supportsnap3)),
            supportsnap4_index: K.ITEM('str', deckCardIndex(deck.supportsnap4_index, DEFAULT_DECK_CARD_INDEXES.supportsnap4)),
            frame_id: K.ITEM('str', `${deck.frame_id || ''}`),
            pose_id: K.ITEM('str', `${deck.pose_id || ''}`),
            another_costume_id: K.ITEM('str', `${deck.another_costume_id || ''}`),
        })),
    };
}

export function buildProfileResponse(profile: PolarisProfileData){
    const playInfo = profile.playInfo || {};
    const mainOption = profile.mainOption || {};
    const counts = profile.counts || {};
    const actionCounts = profile.actionCounts || {};
    const privacy = profile.privacy || {};
    const nametag = profile.nametag || {};
    const sortSetting = profile.sortSetting || {};

    const gachaTicketReceived = toInt(profile.gachaTicketReceived);
    const tutorialSkipped = toInt(profile.tutorialSkipped);
    const isTutorialCleared = true;

    return {
        result: K.ITEM('s32', 0),
        now_date: K.ITEM('str', formatDateTime()),
        usr_id: K.ITEM('s32', toInt(profile.usrId)),
        crew_id: K.ITEM('str', normalizeCrewId(profile.crewId)),
        gacha_ticket_received: K.ITEM('s32', gachaTicketReceived),
        tutorial_skipped: K.ITEM('s32', tutorialSkipped),
        usr_profile: {
            usr_name: K.ITEM('str', `${profile.name || 'PLAYER'}`),
            usr_rank: K.ITEM('s32', toInt(profile.rank, 1)),
            exp: K.ITEM('s32', toInt(profile.exp)),
            comment: K.ITEM('str', `${profile.comment || ''}`),
            is_tutorial_cleared: K.ITEM('bool', isTutorialCleared),
        },
        usr_play_info: {
            softcode: K.ITEM('str', `${playInfo.softcode || ''}`),
            asset_version: K.ITEM('s32', toInt(playInfo.asset_version)),
            start_date: K.ITEM('str', `${playInfo.start_date || ''}`),
            end_date: K.ITEM('str', `${playInfo.end_date || ''}`),
            play_days: K.ITEM('s32', toInt(playInfo.play_days)),
            consecutive_days: K.ITEM('s32', toInt(playInfo.consecutive_days)),
            consecutive_weeks: K.ITEM('s32', toInt(playInfo.consecutive_weeks)),
            last_play_week: K.ITEM('str', `${playInfo.last_play_week || ''}`),
            today_play_count: K.ITEM('s32', toInt(playInfo.today_play_count)),
            mode_id: K.ITEM('s32', toInt(playInfo.mode_id)),
            music_id: K.ITEM('s32', toInt(playInfo.music_id, 3)),
            folder_id: K.ITEM('s32', toInt(playInfo.folder_id, 1)),
            chart_difficulty_type: K.ITEM('s32', toInt(playInfo.chart_difficulty_type)),
            pcb_id: K.ITEM('str', `${playInfo.pcb_id || ''}`),
            loc_id: K.ITEM('str', `${playInfo.loc_id || ''}`),
            shop_name: K.ITEM('str', `${playInfo.shop_name || ''}`),
            beginner_play_count: K.ITEM('s32', toInt(playInfo.beginner_play_count)),
            standard_play_count: K.ITEM('s32', toInt(playInfo.standard_play_count)),
            freetime4_play_count: K.ITEM('s32', toInt(playInfo.freetime4_play_count)),
            freetime6_play_count: K.ITEM('s32', toInt(playInfo.freetime6_play_count)),
            freetime8_play_count: K.ITEM('s32', toInt(playInfo.freetime8_play_count)),
            freetime12_play_count: K.ITEM('s32', toInt(playInfo.freetime12_play_count)),
            local_matching_play_count: K.ITEM('s32', toInt(playInfo.local_matching_play_count)),
            global_matching_play_count: K.ITEM('s32', toInt(playInfo.global_matching_play_count)),
            freetime_play_count: K.ITEM('s32', toInt(playInfo.freetime_play_count)),
            freetime_play_total_time: K.ITEM('s32', toInt(playInfo.freetime_play_total_time)),
        },
        usr_main_option: {
            notes_design_type: K.ITEM('s32', toInt(mainOption.notes_design_type)),
            tap_se_type: K.ITEM('s32', toInt(mainOption.tap_se_type)),
            tap_effect_type: K.ITEM('s32', toInt(mainOption.tap_effect_type)),
            right_fader_color: K.ITEM('s32', toInt(mainOption.right_fader_color)),
            left_fader_color: K.ITEM('s32', toInt(mainOption.left_fader_color)),
            chart_option: K.ITEM('s32', toInt(mainOption.chart_option)),
            high_speed: K.ITEM('s32', toInt(mainOption.high_speed)),
            notes_display_timing: K.ITEM('s32', toInt(mainOption.notes_display_timing)),
            judge_timing: K.ITEM('s32', toInt(mainOption.judge_timing)),
            judge_display_position: K.ITEM('s32', toInt(mainOption.judge_display_position)),
            display_fast_slow: K.ITEM('s32', toInt(mainOption.display_fast_slow)),
            lane_alpha: K.ITEM('s32', toInt(mainOption.lane_alpha)),
            movie_brightness: K.ITEM('s32', toInt(mainOption.movie_brightness)),
            skill_cut_in: K.ITEM('s32', toInt(mainOption.skill_cut_in)),
            is_voice_active: K.ITEM('bool', toBool(mainOption.is_voice_active)),
            combo_special_display: K.ITEM('s32', toInt(mainOption.combo_special_display)),
            music_volume: K.ITEM('s32', toInt(mainOption.music_volume)),
            se_volume: K.ITEM('s32', toInt(mainOption.se_volume)),
            voice_volume: K.ITEM('s32', toInt(mainOption.voice_volume)),
            out_game_music_volume: K.ITEM('s32', toInt(mainOption.out_game_music_volume)),
            out_game_se_volume: K.ITEM('s32', toInt(mainOption.out_game_se_volume)),
            out_game_voice_volume: K.ITEM('s32', toInt(mainOption.out_game_voice_volume)),
            master_volume: K.ITEM('s32', toInt(mainOption.master_volume)),
            headphone_volume: K.ITEM('s32', toInt(mainOption.headphone_volume)),
            bass_shaker_volume: K.ITEM('s32', toInt(mainOption.bass_shaker_volume)),
            force_open_prev_in_game_option: K.ITEM(
                'bool',
                toBool(mainOption.force_open_prev_in_game_option)
            ),
            display_bar_line: K.ITEM('s32', toInt(mainOption.display_bar_line)),
            bga_id: K.ITEM('str', `${mainOption.bga_id || ''}`),
        },
        usr_privacy: {
            disp_name_to_other: K.ITEM('s32', toInt(privacy.disp_name_to_other, 1)),
            disp_shop_to_other: K.ITEM('s32', toInt(privacy.disp_shop_to_other, 1)),
            disp_shop_to_me: K.ITEM('s32', toInt(privacy.disp_shop_to_me, 1)),
            disp_skill_to_other: K.ITEM('s32', toInt(privacy.disp_skill_to_other, 1)),
            disp_skill_to_me: K.ITEM('s32', toInt(privacy.disp_skill_to_me, 1)),
            allow_music_ranking: K.ITEM('s32', toInt(privacy.allow_music_ranking)),
            allow_pa_skill_ranking: K.ITEM('s32', toInt(privacy.allow_pa_skill_ranking)),
        },
        usr_nametag: {
            nametag_badge1_id: K.ITEM('str', `${nametag.nametag_badge1_id || ''}`),
            nametag_badge2_id: K.ITEM('str', `${nametag.nametag_badge2_id || ''}`),
            nametag_badge3_id: K.ITEM('str', `${nametag.nametag_badge3_id || ''}`),
            nametag_plate_id: K.ITEM('str', `${nametag.nametag_plate_id || 'nametag.plate.00000000'}`),
            nametag_title_id: K.ITEM('str', `${nametag.nametag_title_id || 'nametag.title.00000000000'}`),
            set_title_name: K.ITEM('str', `${nametag.set_title_name || ''}`),
            set_title_rarity: K.ITEM('str', `${nametag.set_title_rarity || 'N'}`),
        },
        usr_sort_setting: {
            musicselect_sort: K.ITEM('s32', toInt(sortSetting.musicselect_sort)),
            musicselect_filter: K.ITEM('s32', toInt(sortSetting.musicselect_filter, 3617)),
            musicselect_order: K.ITEM('s32', toInt(sortSetting.musicselect_order)),
            character_training_list_sort: K.ITEM('s32', toInt(sortSetting.character_training_list_sort)),
            character_training_list_filter: K.ITEM('s32', toInt(sortSetting.character_training_list_filter, 33554431)),
            character_training_list_order: K.ITEM('s32', toInt(sortSetting.character_training_list_order)),
            character_replacement_list_sort: K.ITEM('s32', toInt(sortSetting.character_replacement_list_sort, 1)),
            character_replacement_list_filter: K.ITEM('s32', toInt(sortSetting.character_replacement_list_filter, 33554431)),
            character_replacement_list_order: K.ITEM('s32', toInt(sortSetting.character_replacement_list_order)),
            character_material_list_sort: K.ITEM('s32', toInt(sortSetting.character_material_list_sort, 6)),
            character_material_list_filter: K.ITEM('s32', toInt(sortSetting.character_material_list_filter, 33554431)),
            character_material_list_order: K.ITEM('s32', toInt(sortSetting.character_material_list_order)),
        },
        // 실제 해금 상태는 usr_item의 chart.* 아이템으로 취급한다.
        usr_unlock_music: {},
        usr_item: {
            item: [
                // 인벤토리 내역 전송
                ...buildItemEntries(profile.items || []),
                // 전곡 해금 옵션이 켜진 경우에만 곡 해금 아이템을 추가 전송
                ...buildUnlockAllSongItemEntries(),
            ],
        },
        usr_name_titles: buildNameTitleEntries(profile.nameTitles || []),
        usr_deck: buildDeckEntries(profile.decks || []),
        usr_character_card: buildCharacterCardEntries(profile.characterCards || []),
        usr_character: buildCharacterEntries(profile.characters || []),
        usr_login_bonus: {},
        usr_music_mission: buildMusicMissionEntries(profile.musicMissions || []),
        usr_extend_music_mission: buildExtendMusicMissionEntries(profile.extendMusicMissions || []),
        usr_count: buildCountEntries(counts),
        usr_chatstamp: {},
        usr_action_count: buildActionCountEntries(actionCounts),
        pa_skill: buildPaSkillEntries(profile.paSkill || {}),
    };
}

