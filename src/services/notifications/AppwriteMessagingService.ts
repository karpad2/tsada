/**
 * Appwrite Messaging Service
 * Native Appwrite Messaging API for Push Notifications, Email, and SMS
 */

import { Client, Messaging } from 'appwrite';
import { appw, config } from '@/appwrite';

export interface MessagePayload {
  title?: string;
  body?: string;
  data?: Record<string, string>;
  action?: string;
  icon?: string;
  image?: string;
  sound?: string;
  color?: string;
  tag?: string;
  badge?: number;
}

export interface NotificationTarget {
  userId?: string;
  userIds?: string[];
  topic?: string;
  topics?: string[];
}

export interface ScheduleOptions {
  scheduledAt?: string; // ISO 8601 date string
}

export interface NotificationOptions extends ScheduleOptions {
  // iOS specific
  contentAvailable?: boolean; // Background update
  mutableContent?: boolean; // Allow notification modification
  interruptionLevel?: 'passive' | 'active' | 'time-sensitive' | 'critical';

  // Android specific
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
  channelId?: string;

  // Common
  badge?: number;
  sound?: string;
  data?: Record<string, string>;
}

export class AppwriteMessagingService {
  private static instance: AppwriteMessagingService;
  private messaging: Messaging;

  static getInstance(): AppwriteMessagingService {
    if (!AppwriteMessagingService.instance) {
      AppwriteMessagingService.instance = new AppwriteMessagingService();
    }
    return AppwriteMessagingService.instance;
  }

  private constructor() {
    this.messaging = new Messaging(appw);
  }

  /**
   * Create a new push notification message
   */
  async createPushNotification(
    messageId: string,
    payload: MessagePayload,
    target: NotificationTarget,
    options?: NotificationOptions
  ): Promise<any> {
    try {
      const message = await this.messaging.createPush(
        messageId,
        payload.title || '',
        payload.body || '',
        // Topics
        target.topics,
        // Users
        target.userIds,
        // Targets (for individual targeting)
        target.userId ? [target.userId] : undefined,
        // Data
        payload.data,
        // Action (deep link)
        payload.action,
        // Icon
        payload.icon,
        // Sound
        options?.sound,
        // Color
        payload.color,
        // Tag
        payload.tag,
        // Badge
        options?.badge,
        // Draft (false to send immediately)
        false,
        // Scheduled at
        options?.scheduledAt
      );

      return message;
    } catch (error) {
      console.error('Failed to create push notification:', error);
      throw error;
    }
  }

  /**
   * Send push notification to all subscribers (using topic)
   */
  async sendToAll(
    payload: MessagePayload,
    options?: NotificationOptions
  ): Promise<any> {
    return this.createPushNotification(
      'unique()',
      payload,
      { topic: 'all-users' }, // You need to create this topic in Appwrite
      options
    );
  }

  /**
   * Send push notification to specific users
   */
  async sendToUsers(
    userIds: string[],
    payload: MessagePayload,
    options?: NotificationOptions
  ): Promise<any> {
    return this.createPushNotification(
      'unique()',
      payload,
      { userIds },
      options
    );
  }

  /**
   * Send push notification to a topic (group of users)
   */
  async sendToTopic(
    topic: string,
    payload: MessagePayload,
    options?: NotificationOptions
  ): Promise<any> {
    return this.createPushNotification(
      'unique()',
      payload,
      { topics: [topic] },
      options
    );
  }

  /**
   * Schedule a push notification
   */
  async schedulePushNotification(
    payload: MessagePayload,
    target: NotificationTarget,
    scheduledAt: Date,
    options?: NotificationOptions
  ): Promise<any> {
    return this.createPushNotification(
      'unique()',
      payload,
      target,
      {
        ...options,
        scheduledAt: scheduledAt.toISOString(),
      }
    );
  }

  /**
   * Subscribe user to a topic
   */
  async subscribeToTopic(subscriberId: string, topicId: string): Promise<any> {
    try {
      return await this.messaging.createSubscriber(
        topicId,
        subscriberId,
        subscriberId // Target ID (usually user ID)
      );
    } catch (error) {
      console.error('Failed to subscribe to topic:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe user from a topic
   */
  async unsubscribeFromTopic(subscriberId: string): Promise<any> {
    try {
      return await this.messaging.deleteSubscriber(subscriberId);
    } catch (error) {
      console.error('Failed to unsubscribe from topic:', error);
      throw error;
    }
  }

  /**
   * Create a new topic
   */
  async createTopic(
    topicId: string,
    name: string,
    description?: string
  ): Promise<any> {
    try {
      return await this.messaging.createTopic(topicId, name, description);
    } catch (error) {
      console.error('Failed to create topic:', error);
      throw error;
    }
  }

  /**
   * List all topics
   */
  async listTopics(): Promise<any> {
    try {
      return await this.messaging.listTopics();
    } catch (error) {
      console.error('Failed to list topics:', error);
      throw error;
    }
  }

  /**
   * Get message statistics
   */
  async getMessageStatus(messageId: string): Promise<any> {
    try {
      return await this.messaging.getMessage(messageId);
    } catch (error) {
      console.error('Failed to get message status:', error);
      throw error;
    }
  }

  /**
   * List all messages
   */
  async listMessages(limit: number = 25): Promise<any> {
    try {
      return await this.messaging.listMessages([], limit);
    } catch (error) {
      console.error('Failed to list messages:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<any> {
    try {
      return await this.messaging.deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  /**
   * Send critical alert (iOS only - bypasses Do Not Disturb)
   */
  async sendCriticalAlert(
    payload: MessagePayload,
    target: NotificationTarget
  ): Promise<any> {
    return this.createPushNotification(
      'unique()',
      payload,
      target,
      {
        interruptionLevel: 'critical',
        sound: 'critical', // Critical sound
      }
    );
  }

  /**
   * Send background update (silent notification)
   */
  async sendBackgroundUpdate(
    data: Record<string, string>,
    target: NotificationTarget
  ): Promise<any> {
    return this.createPushNotification(
      'unique()',
      { data }, // No title/body for background updates
      target,
      {
        contentAvailable: true, // iOS background update
        priority: 'high', // Android high priority
      }
    );
  }

  /**
   * Send time-sensitive notification
   */
  async sendTimeSensitive(
    payload: MessagePayload,
    target: NotificationTarget
  ): Promise<any> {
    return this.createPushNotification(
      'unique()',
      payload,
      target,
      {
        interruptionLevel: 'time-sensitive',
        priority: 'high',
      }
    );
  }

  /**
   * Create a provider (FCM, APNs, etc.)
   * Note: This is typically done once via Appwrite Console
   */
  async createProvider(
    providerId: string,
    name: string,
    type: 'fcm' | 'apns' | 'email' | 'sms',
    credentials: any
  ): Promise<any> {
    try {
      // This would typically be done via the Appwrite Console
      // or using the Server SDK with API key
      console.warn('Provider creation should be done via Appwrite Console');
      return null;
    } catch (error) {
      console.error('Failed to create provider:', error);
      throw error;
    }
  }
}

export default AppwriteMessagingService;
