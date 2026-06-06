import { savePcbState, syncMatchingRoom } from './service';

export async function pcbSave(_: EamuseInfo, __: any, send: EamuseSend) {
  await send.object(savePcbState());
}

export async function pcbSaveErrorLog(_: EamuseInfo, __: any, send: EamuseSend) {
  await send.object(savePcbState());
}

export async function pcbSyncMatchingRoom(_: EamuseInfo, __: any, send: EamuseSend) {
  await send.object(syncMatchingRoom());
}

export async function pcbSyncMatchingMusic(_: EamuseInfo, __: any, send: EamuseSend) {
  await send.object({});
}

export async function pcbSyncMatchingProgress(_: EamuseInfo, __: any, send: EamuseSend) {
  await send.object({});
}

export async function pcbSyncMatchingGameResult(_: EamuseInfo, __: any, send: EamuseSend) {
  await send.object({});
}

export async function pcbFinishMatchingRoom(_: EamuseInfo, __: any, send: EamuseSend) {
  await send.object({});
}
