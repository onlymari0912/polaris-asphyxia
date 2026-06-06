import {COMMON_EVENT_IDS} from '../common/content/music';
import {MUSIC_CATALOG} from '../common/content/catalog';
import {formatDateTime} from '../common/utils';

export function buildCommonResponse(){
    return {
        now_date: K.ITEM('str', formatDateTime()),
        mst_music: {
            music: MUSIC_CATALOG.map(music => {
                return {
                    music_id: K.ITEM('s32', music.id),
                    charts: {
                        chart: music.noteGrades.map(noteGrade => ({
                            chart_difficulty_type: K.ITEM('s32', noteGrade),
                            limitation_type: K.ITEM('s32', 2),
                            open_at: K.ITEM('str', '2000-01-01 00:00:00'),
                            close_at: K.ITEM('str', '2099-12-31 23:59:59'),
                        })),
                    },
                };
            }),
        },
        mst_demo: {},
        mst_event: {
            event_item: COMMON_EVENT_IDS.map(eventId => ({
                id: K.ITEM('str', eventId),
                param: K.ITEM('str', ''),
                open_at: K.ITEM('str', '2026-01-01 00:00:00'),
                close_at: K.ITEM('str', '2040-12-31 14:59:59'),
            })),
        },
        mst_patch: {
            version: K.ITEM('s32', 0),
            patch: K.ITEM('str', ''),
        },
    };
}
