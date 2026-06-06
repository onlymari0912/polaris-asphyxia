import {
  beginGacha,
  drawGacha,
  endGacha,
  getGachaInfo,
} from './service';

export async function gachaGetGachaInfo(_: EamuseInfo, __: any, send: EamuseSend) {
  await send.object(getGachaInfo());
}

export async function gachaBeginGacha(_: EamuseInfo, data: any, send: EamuseSend) {
  await send.object(await beginGacha(data));
}

export async function gachaDrawGacha(_: EamuseInfo, data: any, send: EamuseSend) {
  await send.object(drawGacha(data));
}

export async function gachaEndGacha(_: EamuseInfo, data: any, send: EamuseSend) {
  await send.object(await endGacha(data));
}
