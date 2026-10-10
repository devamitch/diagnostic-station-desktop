import { toast } from 'sonner';

interface NotifyOptions {
	sound?: boolean;
	persistent?: boolean;
	volume?: number;
	urgency?: 'low' | 'normal' | 'critical';
	icon?: string;
}

export const notify = async (
	message: string,
	type: 'success' | 'error' | 'info' = 'info',
	options: NotifyOptions = {}
): Promise<void> => {
	const { sound = true, persistent = false, volume = 0.4, urgency = 'normal', icon } = options;
	const title = type.charAt(0).toUpperCase() + type.slice(1);

	// --- 1️⃣ Toast Notification ---
	try {
		showToast(type, message, persistent);
	} catch (err) {
		console.error('Toast notification failed:', err);
	}

	// --- 2️⃣ Electron Notification ---
	try {
		if (window?.ipc?.showNotification) {
			await window.ipc.showNotification({
				title,
				body: message,
				sound,
				volume,
				urgency,
				icon,
			});
		}
	} catch (err) {
		console.warn('Electron notification failed:', err);
	}

	// --- 3️⃣ Browser Notification ---
	try {
		await showBrowserNotification(title, message, persistent, icon);
	} catch (err) {
		console.warn('Browser notification failed:', err);
	}

	// --- 4️⃣ Sound Alert ---
	if (sound) {
		try {
			playBeep(type, volume);
		} catch (err) {
			console.warn('Sound playback failed:', err);
		}
	}

	// --- 5️⃣ Console Log ---
	try {
		console.log(`🔔 [${type.toUpperCase()}] ${message}`);
	} catch {
		// safe fallback
	}
};

// ---------- Helpers ----------

const showToast = (type: string, message: string, persistent: boolean): void => {
	const duration = persistent ? Infinity : 4000;
	switch (type) {
		case 'success':
			toast.success(message, { duration });
			break;
		case 'error':
			toast.error(message, { duration });
			break;
		default:
			toast.info(message, { duration });
			break;
	}
};

const showBrowserNotification = async (
	title: string,
	body: string,
	persistent: boolean,
	icon?: string
): Promise<void> => {
	if (!('Notification' in window)) return;
	const iconData = icon || getIcon(title.toLowerCase());

	// Check or request permission first
	if (Notification.permission === 'default') {
		const permission = await Notification.requestPermission();
		if (permission !== 'granted') return;
	}

	if (Notification.permission === 'granted') {
		const notification = new Notification(title, {
			body,
			requireInteraction: persistent,
			icon: iconData,
		});

		if (!persistent) {
			setTimeout(() => notification.close(), 5000);
		}

		notification.onclick = () => window.focus();
	}
};

const playBeep = (type: string, volume: number): void => {
	try {
		const audio = new Audio('notify.wav');
		audio.volume = volume;
		audio.play().catch(() => {
			// fallback to beep
			const ctx = new AudioContext();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.frequency.value = 880;
			gain.gain.value = volume;
			osc.start();
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
			osc.stop(ctx.currentTime + 0.3);
		});
	} catch (err) {
		const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
		if (!AudioCtx) return;

		const ctx = new AudioCtx();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		const frequencies = { success: 880, error: 220, info: 440 };
		osc.frequency.value = frequencies[type as keyof typeof frequencies] || 440;
		gain.gain.value = volume;

		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start();
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
		osc.stop(ctx.currentTime + 0.3);
	}
};

const getIcon = (type: string): string => {
	const icons = {
		success:
			'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDg5ODY2IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCI+PHBhdGggZD0iTTkgMTdsLTEtMSAzLjUtMy41TDcuNSA5bC0xLjUtMS41LTQgNC40IDcuNSAxMC41bDkuNS0xOSAxLjUgMS41TDkgMTd6Ii8+PC9zdmc+',
		error: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjRkQ0MzQzIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCI+PHBhdGggZD0iTTEyIDIyYy01LjUyIDAtMTAtNC40OC0xMC0xMFM2LjQ4IDIgMTIgMmM1LjUyIDAgMTAgNC40OCAxMCAxMFMxNy41MiAyMiAxMiAyMnpNMTAgMTZoNHY0aC00di00em0wLTExaDR2OGgtNHYtOHoiLz48L3N2Zz4=',
		info: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjNDQ0Q0ZGIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCI+PHBhdGggZD0iTTEyIDIyYy01LjUyIDAtMTAtNC40OC0xMC0xMFM2LjQ4IDIgMTIgMmM1LjUyIDAgMTAgNC40OCAxMCAxMFMxNy41MiAyMiAxMiAyMnpNMTAgMThoNHY0aC00di00em0wLTExaDR2OGgtNHYtOHoiLz48L3N2Zz4=',
	};
	return icons[type as keyof typeof icons] || icons.info;
};
