// Telefon özelliklerinin tek giriş noktası. Uygulama kodu navigator.* / window olaylarına doğrudan değil,
// buradan erişir. Faz 4'te (Capacitor) yalnızca bu klasördeki uygulamalar değişir, ekranlar değişmez.
export * from "./platform";
export * as geolocation from "./location";
export * as sensors from "./motion";
export * as share from "./share";
export * as device from "./device";
export * as push from "./push";
export * as purchases from "./purchases";
export { haptics } from "./haptics";
