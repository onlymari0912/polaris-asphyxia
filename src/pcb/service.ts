import { formatDateTime } from '../common/utils';

export function savePcbState() {
  return {
    now_date: K.ITEM('str', formatDateTime()),
  };
}

export function syncMatchingRoom() {
  return {
    matching_room: {
      match_id: K.ITEM('s32', 0),
      location: K.ITEM('str', ''),
      timeup: K.ITEM('bool', false),
      decided: K.ITEM('bool', false),
      created_at: K.ITEM('str', ''),
      now_date: K.ITEM('str', formatDateTime()),
      usr_id_1: K.ITEM('s32', 0),
      usr_id_2: K.ITEM('s32', 0),
      usr_id_3: K.ITEM('s32', 0),
      usr_id_4: K.ITEM('s32', 0),
    },
  };
}
