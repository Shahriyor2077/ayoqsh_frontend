export function formatLiters(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "0";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0";
    return parseFloat(num.toFixed(2)).toString();
}
