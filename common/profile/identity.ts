import {PolarisIdentity} from './types';
import {parseCompositeId} from '../utils';

function cleanId(value: unknown){
    return `${value || ''}`.trim();
}

export function readPolarisIdentity(data: KDataReader): PolarisIdentity{
    const refId = cleanId(data.str('ref_id'));
    const dataId = cleanId(data.str('data_id'));
    const rawCardId = cleanId(data.str('card_id'));
    const parsedCardId = rawCardId.includes('|') ? parseCompositeId(rawCardId) : null;
    const cardId = parsedCardId?.printedCard || rawCardId;
    const attrRefId = cleanId(data.attr().refid);
    const attrDataId = cleanId(data.attr().dataid);
    const canonicalRefId = refId || dataId || attrRefId || attrDataId || parsedCardId?.refId || '';

    return {
        refId: canonicalRefId,
        cardId,
        printedCard: cardId,
    };
}
