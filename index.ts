import {
  usrCheckin,
  usrCheckout,
  usrGet,
  usrGetTemp,
  usrGetUsrMusic,
  usrSave,
  usrSaveMusicScore,
  usrSaveTemp,
  usrSignUp,
} from './usr/routes';
import {
  pcbFinishMatchingRoom,
  pcbSave,
  pcbSaveErrorLog,
  pcbSyncMatchingGameResult,
  pcbSyncMatchingMusic,
  pcbSyncMatchingProgress,
  pcbSyncMatchingRoom,
} from './pcb/routes';
import {
  gachaBeginGacha,
  gachaDrawGacha,
  gachaEndGacha,
  gachaGetGachaInfo,
} from './gacha/routes';
import { mstGetCommon } from './mst/routes';

export function register() {
  R.GameCode('XIF');
  R.GameCode('LAV');
  R.Config('unlock_all_songs', {
    type: 'boolean',
    default: true,
    name: '전곡 해금',
    desc: '플레이어가 보유한 해금 아이템과 별개로 모든 곡 해금 아이템을 응답에 추가합니다.',
  });

  R.Route('usr.sign_up', usrSignUp);
  R.Route('usr.get', usrGet);
  R.Route('usr.save', usrSave);
  R.Route('usr.get_usr_music', usrGetUsrMusic);
  R.Route('usr.save_musicscore', usrSaveMusicScore);
  R.Route('usr.checkin', usrCheckin);
  R.Route('usr.checkout', usrCheckout);
  R.Route('usr.get_temp', usrGetTemp);
  R.Route('usr.save_temp', usrSaveTemp);

  R.Route('pcb.save', pcbSave);
  R.Route('pcb.save_error_log', pcbSaveErrorLog);
  R.Route('pcb.sync_matching_room', pcbSyncMatchingRoom);
  R.Route('pcb.sync_matching_music', pcbSyncMatchingMusic);
  R.Route('pcb.sync_matching_progress', pcbSyncMatchingProgress);
  R.Route('pcb.sync_matching_game_result', pcbSyncMatchingGameResult);
  R.Route('pcb.finish_matching_room', pcbFinishMatchingRoom);

  R.Route('mst.get_common', mstGetCommon);

  R.Route('gacha.get_gacha_info', gachaGetGachaInfo);
  R.Route('gacha.begin_gacha', gachaBeginGacha);
  R.Route('gacha.draw_gacha', gachaDrawGacha);
  R.Route('gacha.end_gacha', gachaEndGacha);
}
