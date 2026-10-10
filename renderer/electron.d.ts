import { IpcHandler } from '../main/preload';

export interface IElectronAPI {
	showNotification(arg0: { title: 'success' | 'error' | 'info'; body: string }): unknown;
	on: (channel: string, callback: (...args: any[]) => void) => void;
	send: (channel: string, args: any) => void;
	invoke: <T>(channel: string, args?: any) => Promise<T>;
	removeListener: (channel: string, callback: (...args: any[]) => void) => void;
	removeAllListeners: (channel: string) => void;
}
type DocumentPictureInPicture = {
	requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
	readonly window: Window | null;
};
declare global {
	interface Window {
		electronAPI?: IElectronAPI;
		ipc: IpcHandler;
		wakeLock?: any;
		pipIpc?: {
			onFrameUpdate: (callback: (imageData: string) => void) => void;
			removeFrameListener: () => void;
		};
		documentPictureInPicture?: DocumentPictureInPicture;
	}
}

export {};
