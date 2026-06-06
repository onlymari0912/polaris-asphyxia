export type GachaCategory = 'Contenter' | 'Snapshot';

export type GachaEntry = {
    id: number;
    category: GachaCategory;
    consume_item?: {
        id?: string;
        count?: number;
    };
    payment_type?: string[] | number | string;
    items?: string[];
    pickups?: string[];
};

export type CharacterCard = {
    card_id: string;
    rarity: string;
};

export type GachaOptions = {
    pickup_rate_percent?: number;
    rarity_weights_by_category?: Record<string, Record<string, number>>;
};
