const gachaTransactions = new Map<string, number>();

export function rememberGachaTransaction(transactionId: string, gachaId: number){
    if(transactionId){
        gachaTransactions.set(transactionId, gachaId);
    }
}

export function consumeGachaTransaction(transactionId: string, fallbackGachaId: number){
    const gachaId = gachaTransactions.get(transactionId) || fallbackGachaId;
    if(transactionId){
        gachaTransactions.delete(transactionId);
    }
    return gachaId;
}
