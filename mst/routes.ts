import {buildCommonResponse} from './response';

export async function mstGetCommon(_: EamuseInfo, __: any, send: EamuseSend){
    await send.object(buildCommonResponse());
}
