export const USR_PROFILE_INT_FIELDS = new Set(['usr_rank', 'exp']);
export const USR_PROFILE_BOOL_FIELDS = new Set(['is_tutorial_cleared']);

export const PLAY_INFO_INT_FIELDS = new Set([
    'asset_version',
    'play_days',
    'consecutive_days',
    'consecutive_weeks',
    'today_play_count',
    'mode_id',
    'music_id',
    'folder_id',
    'chart_difficulty_type',
    'beginner_play_count',
    'standard_play_count',
    'freetime4_play_count',
    'freetime6_play_count',
    'freetime8_play_count',
    'freetime12_play_count',
    'local_matching_play_count',
    'global_matching_play_count',
    'freetime_play_count',
    'freetime_play_total_time',
]);

export const PLAY_INFO_COUNTER_FIELDS = new Set([
    'beginner_play_count',
    'standard_play_count',
    'freetime4_play_count',
    'freetime6_play_count',
    'freetime8_play_count',
    'freetime12_play_count',
    'local_matching_play_count',
    'global_matching_play_count',
    'freetime_play_count',
    'freetime_play_total_time',
]);

export const MAIN_OPTION_INT_FIELDS = new Set([
    'notes_design_type',
    'tap_se_type',
    'tap_effect_type',
    'right_fader_color',
    'left_fader_color',
    'chart_option',
    'high_speed',
    'notes_display_timing',
    'judge_timing',
    'judge_display_position',
    'display_fast_slow',
    'lane_alpha',
    'movie_brightness',
    'skill_cut_in',
    'combo_special_display',
    'music_volume',
    'se_volume',
    'voice_volume',
    'out_game_music_volume',
    'out_game_se_volume',
    'out_game_voice_volume',
    'master_volume',
    'headphone_volume',
    'bass_shaker_volume',
    'display_bar_line',
]);

export const MAIN_OPTION_BOOL_FIELDS = new Set([
    'is_voice_active',
    'force_open_prev_in_game_option',
]);

export const PRIVACY_INT_FIELDS = new Set([
    'disp_name_to_other',
    'disp_shop_to_other',
    'disp_shop_to_me',
    'disp_skill_to_other',
    'disp_skill_to_me',
    'allow_music_ranking',
    'allow_pa_skill_ranking',
]);

export const SORT_SETTING_INT_FIELDS = new Set([
    'musicselect_sort',
    'musicselect_filter',
    'musicselect_order',
    'character_training_list_sort',
    'character_training_list_filter',
    'character_training_list_order',
    'character_replacement_list_sort',
    'character_replacement_list_filter',
    'character_replacement_list_order',
    'character_material_list_sort',
    'character_material_list_filter',
    'character_material_list_order',
]);
