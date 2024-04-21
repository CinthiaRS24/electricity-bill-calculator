export interface InfoData {
    date: string;
    floors: number[]; // Kwatts
    buildingConsumption: number; // Kwatts
}

export interface HeaderItem {
    title: string;
    align?: 'start' | 'center' | 'end'; 
    children: { title: string; value: string; align: string }[];
}

export interface TableRowItem {
    title: string; // floor
    prev: string | undefined; // consumption shown on the meter from the previous month
    current: string | undefined;   // consumption shown on the meter from the current month
    kwattsDiff: string | undefined;  // difference in consumption from the previous month to the current month (start - end)
    kwattsPerDay: string | undefined; // the difference is divided by the days elapsed (usually 30)
    wattsPerDay: number;  // kwatts x 1000 (watts consumed per day)
}

export interface TableWithConstant {
    title: string;
    watts: number;
    price: number
}

export interface FinalArray {
    title: string;
    price: number;
    totalPrice: number
}