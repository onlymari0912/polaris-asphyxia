import {
    emptyUsrResponse,
    getUser,
    getUserMusic,
    saveMusicScore,
    saveUser,
    signUpUser,
    UsrServiceResult,
} from './service';

async function sendUsrResult(result: UsrServiceResult, send: EamuseSend){
    if(result.denied){
        await send.deny();
        return;
    }

    await send.object(result.payload || {});
}

export async function usrSignUp(_: EamuseInfo, data: any, send: EamuseSend){
    await sendUsrResult(await signUpUser(data), send);
}

export async function usrGet(_: EamuseInfo, data: any, send: EamuseSend){
    await sendUsrResult(await getUser(data), send);
}

export async function usrSave(_: EamuseInfo, data: any, send: EamuseSend){
    await sendUsrResult(await saveUser(data), send);
}

export async function usrGetUsrMusic(_: EamuseInfo, data: any, send: EamuseSend){
    await sendUsrResult(await getUserMusic(data), send);
}

export async function usrSaveMusicScore(_: EamuseInfo, data: any, send: EamuseSend){
    await sendUsrResult(await saveMusicScore(data), send);
}

export async function usrCheckin(_: EamuseInfo, __: any, send: EamuseSend){
    await sendUsrResult(emptyUsrResponse(), send);
}

export async function usrCheckout(_: EamuseInfo, __: any, send: EamuseSend){
    await sendUsrResult(emptyUsrResponse(), send);
}

export async function usrGetTemp(_: EamuseInfo, __: any, send: EamuseSend){
    await sendUsrResult(emptyUsrResponse(), send);
}

export async function usrSaveTemp(_: EamuseInfo, __: any, send: EamuseSend){
    await sendUsrResult(emptyUsrResponse(), send);
}
