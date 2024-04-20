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
    title: string;
    start: string;
    end: string;
    difference: string;
    kwatts: string;
    watts: number;
}