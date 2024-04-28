export function roundTo2Decimals(num: number): number {
    return Math.round(num * 100) / 100;
}

export function getElapsedDays(currentDate, prevDate): number {
    if (!currentDate || !prevDate) return 0;
    const differenceInMilliseconds = Number(new Date(currentDate)) - Number(new Date(prevDate));
    const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);
    return differenceInDays;
}

export function convertDate(originalDate: string) {
    const parsedDate = new Date(originalDate);
    const day = parsedDate.getUTCDate().toString().padStart(2, '0');
    const month = (parsedDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = parsedDate.getFullYear().toString();
    return day + month + year;
}
