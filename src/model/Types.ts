export interface InfoItem {
    date: string;
    suma: number;
    quinto: number;
    cuarto: number;
    tercero: number;
    segundo: number;
    primero: number;
    [key: string]: string | number;
}

export interface HeaderItem {
    title: string;
    align: string;
    children: { title: string; value: string; align: string }[];
}