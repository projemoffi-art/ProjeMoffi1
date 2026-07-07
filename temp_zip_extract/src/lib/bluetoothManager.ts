/**
 * Web Bluetooth Heart Rate Manager
 * Standard Service: 0x180D (Heart Rate)
 * Standard Characteristic: 0x2A37 (Heart Rate Measurement)
 */

export function parseHeartRate(dataView: DataView): number {
    const flags = dataView.getUint8(0);
    const rate16Bits = flags & 0x01;
    let heartRate;
    
    if (rate16Bits) {
        // Heart Rate is 16-bit (UINT16), starts at byte 1
        heartRate = dataView.getUint16(1, true); // true for little-endian
    } else {
        // Heart Rate is 8-bit (UINT8), starts at byte 1
        heartRate = dataView.getUint8(1);
    }
    
    return heartRate;
}

export const HR_SERVICE_UUID = 'heart_rate';
export const HR_CHARACTERISTIC_UUID = 'heart_rate_measurement';

export async function requestHRDevice(): Promise<BluetoothDevice> {
    if (!navigator.bluetooth) {
        throw new Error("Web Bluetooth is not supported in this browser.");
    }

    return await navigator.bluetooth.requestDevice({
        filters: [{ services: [HR_SERVICE_UUID] }],
        optionalServices: ['battery_service', 'device_information']
    });
}
