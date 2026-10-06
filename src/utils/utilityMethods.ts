export function roundTo2Decimals(num: number): number {
    return Math.round(num * 100) / 100;
}

export function getElapsedDays(currentDate: string, prevDate: string) {
    if (!currentDate || !prevDate) return 0;
    const differenceInMilliseconds = Number(new Date(currentDate)) - Number(new Date(prevDate));
    const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);
    return differenceInDays;
}

/**
 * Reads what was typed into a number field. Accepts a comma as the decimal
 * separator, the way the amounts are written on the spreadsheet, and returns null
 * for an empty field so it can be told apart from a genuine zero.
 */
export function parseDecimalInput(raw: string | number | null | undefined): number | null {
    if (raw === null || raw === undefined) return null;

    const normalized = String(raw).trim().replace(',', '.');
    if (normalized === '') return null;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

/** Turns an ISO date into the DDMMYYYY used to name the documents in Firestore. */
export function convertDate(originalDate: string) {
    const parsedDate = new Date(originalDate);
    const day = parsedDate.getUTCDate().toString().padStart(2, '0');
    const month = (parsedDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = parsedDate.getFullYear().toString();
    return day + month + year;
}