
/**
 * Moffi Share Engine
 * Professional sharing utilities for social platforms
 */

export const PLATFORMS = {
    WHATSAPP: 'WhatsApp',
    INSTAGRAM: 'Instagram',
    STORY: 'Hikayem',
    MESSAGES: 'Mesajlar',
    TWITTER: 'Twitter',
    FACEBOOK: 'Facebook'
};

export function getShareUrl(platform: string, postUrl: string, postText: string) {
    const encodedUrl = encodeURIComponent(postUrl);
    const encodedText = encodeURIComponent(postText);

    switch (platform) {
        case PLATFORMS.WHATSAPP:
            return `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
        case PLATFORMS.TWITTER:
            return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        case PLATFORMS.FACEBOOK:
            return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        case PLATFORMS.MESSAGES:
            // Mobile specific
            return `sms:?body=${encodedText}%20${encodedUrl}`;
        default:
            return null;
    }
}

export async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Copy failed:', err);
        return false;
    }
}

export function generatePostDeepLink(postId: string | number) {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/topluluk?post=${postId}`;
}
