export interface InfoData {
    date: string;
    floors: number[];
}

export interface HeaderItem {
    title: string;
    align?: 'start' | 'center' | 'end'; 
    children: { title: string; value: string; align: string }[];
}

export interface BillData {
    title: string; // floor
    start: string; // consumption shown on the meter from the previous month
    end: string;   // consumption shown on the meter from the current month
    difference: string;  // difference in consumption from the previous month to the current month (start - end)
    kwatts: string; // the difference is divided by the days elapsed (usually 30)
    watts: number;  // kwatts x 1000 (watts consumed per day)
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