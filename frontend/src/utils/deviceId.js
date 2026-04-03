/**
 * Generate a stable device fingerprint for invite code binding
 * Uses browser fingerprinting techniques to create a unique ID
 */

function generateDeviceId() {
    // Check if we already have a device ID stored
    let deviceId = localStorage.getItem('device_id');
    if (deviceId) {
        return deviceId;
    }

    // Generate new device ID based on browser characteristics
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        !!window.sessionStorage,
        !!window.localStorage,
    ];

    // Simple hash function
    const hash = components.join('|').split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);

    deviceId = 'dev_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);

    // Store for future use
    localStorage.setItem('device_id', deviceId);

    return deviceId;
}

export { generateDeviceId };
