/**
 * Push Notification Service
 * Handles browser push notifications using Web Push API and Service Worker
 */

import { Databases, Query } from 'appwrite';
import { config, appw } from '@/appwrite';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  vibrate?: number[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private permission: NotificationPermission = 'default';
  private subscription: globalThis.PushSubscription | null = null;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private constructor() {
    this.init();
  }

  /**
   * Initialize the notification service
   */
  private async init(): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported in this browser');
      return;
    }

    this.permission = Notification.permission;

    // Check if already subscribed
    if (this.permission === 'granted') {
      await this.getSubscription();
    }
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported');
    }

    if (this.permission === 'granted') {
      return this.permission;
    }

    this.permission = await Notification.requestPermission();

    if (this.permission === 'granted') {
      await this.subscribe();
    }

    return this.permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<globalThis.PushSubscription | null> {
    if (!this.isSupported() || this.permission !== 'granted') {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
          ),
        });
      }

      this.subscription = subscription;

      // Save subscription to backend (Appwrite)
      await this.saveSubscriptionToBackend(subscription);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      const subscription = await this.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromBackend(subscription);
        this.subscription = null;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<globalThis.PushSubscription | null> {
    if (!this.isSupported()) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      this.subscription = await registration.pushManager.getSubscription();
      return this.subscription;
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  /**
   * Show a local notification (doesn't require permission if SW is registered)
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.png',
        badge: payload.badge || '/favicon.png',
        image: payload.image,
        data: payload.data,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false,
        actions: payload.actions,
        vibrate: payload.vibrate || [200, 100, 200],
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
      throw error;
    }
  }

  /**
   * Get notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  /**
   * Check if user is subscribed
   */
  async isSubscribed(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  /**
   * Save subscription to Appwrite backend
   */
  private async saveSubscriptionToBackend(
    subscription: globalThis.PushSubscription
  ): Promise<void> {
    try {
      const database = new Databases(appw);
      const subscriptionData = subscription.toJSON();

      // Generate unique ID from endpoint
      const subscriptionId = btoa(subscription.endpoint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 36);

      await database.createDocument(
        config.website_db,
        config.push_subscriptions || 'push_subscriptions', // Add this to your config
        subscriptionId,
        {
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.keys?.p256dh,
          auth: subscriptionData.keys?.auth,
          user_agent: navigator.userAgent,
          subscribed_at: new Date().toISOString(),
        }
      );
    } catch (error: any) {
      // If document already exists, update it
      if (error.code === 409) {
        console.log('Subscription already exists');
      } else {
        console.error('Failed to save subscription to backend:', error);
      }
    }
  }

  /**
   * Remove subscription from backend
   */
  private async removeSubscriptionFromBackend(
    subscription: globalThis.PushSubscription
  ): Promise<void> {
    try {
      const database = new Databases(appw);
      const subscriptionId = btoa(subscription.endpoint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 36);

      await database.deleteDocument(
        config.website_db,
        config.push_subscriptions || 'push_subscriptions',
        subscriptionId
      );
    } catch (error) {
      console.error('Failed to remove subscription from backend:', error);
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

export default PushNotificationService;
