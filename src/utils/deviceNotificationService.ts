/**
 * Device Notification Service for Mobile, Tablet & Desktop OS-level alerts
 * Enables real push notifications that appear in Phone/Tablet Notification Center & Lock Screen
 * outside the active web browser window.
 */

class DeviceNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initServiceWorker();
  }

  // Register service worker for reliable mobile/tablet background notifications
  public async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;
      return reg;
    } catch (err) {
      console.warn('Service Worker registration skipped or failed:', err);
      return null;
    }
  }

  // Check if browser/device supports Web Notifications
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  // Get current permission status
  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  // Check if running inside iframe (which may restrict browser native permission dialogs)
  public isInIframe(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }

  // Request user permission for device OS push notifications
  public async requestPermission(): Promise<NotificationPermission> {
    // Always unlock audio chime on user click
    this.playChime();

    if (!this.isSupported()) {
      return 'denied';
    }

    try {
      // Modern Promise-based API with callback fallback for older Safari / Mobile Webviews
      let permission: NotificationPermission;
      
      const req = Notification.requestPermission();
      if (req && typeof req.then === 'function') {
        permission = await req;
      } else {
        permission = await new Promise<NotificationPermission>((resolve) => {
          Notification.requestPermission((p) => resolve(p));
        });
      }

      if (permission === 'granted') {
        await this.initServiceWorker();
      }
      return permission;
    } catch (err) {
      console.warn('Notification permission request returned error (likely iframe restriction):', err);
      return this.getPermission();
    }
  }

  // Play pleasant Islamic institutional chime sound
  public playChime() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext || this.audioContext.state === 'suspended') {
        this.audioContext = new AudioCtx();
      }

      const ctx = this.audioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // 2-tone melodic harmonic chime (E5 -> A5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.5, now); // E6 harmonic

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch {
      // Audio context safe fallback
    }
  }

  // Trigger tactile vibration on phone/tablet
  public triggerVibration(pattern: number[] = [150, 100, 200, 100, 150]) {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Vibration not supported
    }
  }

  // Dispatch real OS-level notification on Phone / Tablet / PC
  public async sendDeviceAlert({
    title,
    body,
    tag,
    url = '/dashboard/guru',
    urgency = 'high',
    requireInteraction = false
  }: {
    title: string;
    body: string;
    tag?: string;
    url?: string;
    urgency?: 'high' | 'medium' | 'info';
    requireInteraction?: boolean;
  }): Promise<boolean> {
    // 1. Always play tactile feedback and chime
    this.triggerVibration(urgency === 'high' ? [200, 100, 200, 100, 200] : [150, 80, 150]);
    this.playChime();

    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    const options: NotificationOptions & { vibrate?: number[]; renotify?: boolean } = {
      body,
      icon: '/logo.jpeg',
      badge: '/logo.jpeg',
      tag: tag || `bqa_alert_${Date.now()}`,
      renotify: true,
      requireInteraction: requireInteraction || urgency === 'high',
      data: {
        url,
        timestamp: Date.now()
      },
      vibrate: [200, 100, 200]
    };

    try {
      // Prefer service worker showNotification for reliable lock screen & background display
      if (this.swRegistration && 'showNotification' in this.swRegistration) {
        await this.swRegistration.showNotification(title, options);
        return true;
      } else if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, options);
        return true;
      } else {
        // Direct browser notification fallback
        const notif = new Notification(title, options);
        notif.onclick = (event) => {
          event.preventDefault();
          window.focus();
          if (url) {
            window.location.href = url;
          }
          notif.close();
        };
        return true;
      }
    } catch (err) {
      console.warn('Native notification failed, falling back to standard notification:', err);
      try {
        const notif = new Notification(title, options);
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        return true;
      } catch {
        return false;
      }
    }
  }

  // Send a test notification to verify Phone/Tablet lock screen functionality
  public async sendTestNotification(): Promise<boolean> {
    const perm = await this.requestPermission();
    if (perm !== 'granted') return false;

    return this.sendDeviceAlert({
      title: "Baitul Qur'an Al-Ikhwan • Uji Notifikasi",
      body: "Notifikasi sistem HRIS aktif! Anda akan menerima pengingat jadwal, badal, dan presensi langsung di layar HP/Tablet.",
      tag: 'bqa_test_notification',
      url: '/dashboard/guru',
      urgency: 'high'
    });
  }
}

export const deviceNotificationService = new DeviceNotificationService();
