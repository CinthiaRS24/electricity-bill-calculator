import { toBlob } from 'html-to-image';

/**
 * Renders a DOM node as a PNG. The node is measured at its own layout size, so a
 * result card wrapped in a horizontal scroller is still captured complete.
 */
export async function nodeToPngBlob(node: HTMLElement): Promise<Blob> {
    const blob = await toBlob(node, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        width: node.scrollWidth,
        height: node.scrollHeight,
    });

    if (!blob) throw new Error('No se pudo generar la imagen.');

    return blob;
}

export function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

export function canSharePng(): boolean {
    if (typeof navigator === 'undefined' || !navigator.canShare) return false;

    const probe = new File([new Blob()], 'probe.png', { type: 'image/png' });
    return navigator.canShare({ files: [probe] });
}

/**
 * Opens the phone's share sheet so the image can go straight to WhatsApp.
 * Returns false when the browser cannot share files and the caller should download instead.
 */
export async function sharePng(blob: Blob, fileName: string, title: string): Promise<boolean> {
    if (!canSharePng()) return false;

    const file = new File([blob], fileName, { type: 'image/png' });

    try {
        await navigator.share({ files: [file], title });
        return true;
    } catch (error) {
        // The user dismissing the share sheet is not a failure worth reporting.
        if (error instanceof DOMException && error.name === 'AbortError') return true;
        return false;
    }
}
