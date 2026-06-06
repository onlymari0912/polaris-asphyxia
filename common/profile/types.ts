export interface PolarisIdentity{
    refId: string;
    cardId: string;
    printedCard: string;
}

export type PolarisScalar = string | number | boolean;
export type PolarisScalarMap = Record<string, PolarisScalar>;
export type PolarisItemData = Record<string, string | number>;
export type PolarisCharacterCardData = Record<string, PolarisScalar | string[] | undefined> & {
    additional_skills?: string[];
};

export interface PolarisProfileData{
    collection: 'profile';
    refId: string;
    printedCard: string;
    name: string;
    usrId: number;
    crewId: string;
    version: Record<string, unknown>;
    rank: number;
    exp: number;
    comment: string;
    gachaTicketReceived: number;
    tutorialSkipped: number;
    isTutorialCleared: number;
    playInfo: PolarisScalarMap;
    mainOption: PolarisScalarMap;
    privacy: PolarisScalarMap;
    nametag: PolarisScalarMap;
    sortSetting: PolarisScalarMap;
    unlockMusic: PolarisItemData[];
    items: PolarisItemData[];
    nameTitles: string[];
    decks: PolarisScalarMap[];
    characterCards: PolarisCharacterCardData[];
    characters: PolarisItemData[];
    musicMissions: PolarisScalarMap[];
    extendMusicMissions: PolarisScalarMap[];
    paSkill: Record<string, any>;
    counts: Record<string, number>;
    actionCounts: Record<string, number>;
    processedUuids: string[];
    actionLogs?: {
        uuid?: string;
        key?: string;
        change?: number;
        ts?: number;
    }[];
}
