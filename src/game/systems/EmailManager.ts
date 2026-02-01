/**
 * EmailManager
 * Manages in-game email system with YAML-driven content
 */

import type { EmailDefinition } from '@scripting/types/ScenarioTypes.js';

export interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  received: boolean;
  read: boolean;
  archived: boolean;
  receivedTime: string; // ISO timestamp
  requiresResponse?: boolean;
  responded?: boolean;
}

export type EmailFilterType = 'all' | 'unread' | 'high-priority' | 'archived';

export class EmailManager {
  private emails: Map<string, Email> = new Map();
  private unreadCount: number = 0;
  private listeners: Set<(emails: Email[]) => void> = new Set();

  /**
   * Add a new email from a YAML definition
   */
  receiveEmail(definition: EmailDefinition): void {
    const email: Email = {
      id: definition.id,
      from: definition.from,
      subject: definition.subject,
      body: definition.body,
      priority: definition.priority,
      received: true,
      read: definition.read || false,
      archived: false,
      receivedTime: new Date().toISOString(),
      requiresResponse: definition.requiresResponse,
      responded: false,
    };

    this.emails.set(email.id, email);

    if (!email.read) {
      this.unreadCount++;
    }

    this.notifyListeners();

    console.log(`📧 New email from ${email.from}: ${email.subject}`);
  }

  /**
   * Mark an email as read
   */
  markAsRead(emailId: string): void {
    const email = this.emails.get(emailId);
    if (email && !email.read) {
      email.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notifyListeners();
    }
  }

  /**
   * Mark an email as unread
   */
  markAsUnread(emailId: string): void {
    const email = this.emails.get(emailId);
    if (email && email.read) {
      email.read = false;
      this.unreadCount++;
      this.notifyListeners();
    }
  }

  /**
   * Archive an email
   */
  archive(emailId: string): void {
    const email = this.emails.get(emailId);
    if (email && !email.archived) {
      email.archived = true;
      this.notifyListeners();
    }
  }

  /**
   * Unarchive an email
   */
  unarchive(emailId: string): void {
    const email = this.emails.get(emailId);
    if (email && email.archived) {
      email.archived = false;
      this.notifyListeners();
    }
  }

  /**
   * Mark an email as responded
   */
  markAsResponded(emailId: string): void {
    const email = this.emails.get(emailId);
    if (email && email.requiresResponse) {
      email.responded = true;
      this.notifyListeners();
    }
  }

  /**
   * Delete an email
   */
  deleteEmail(emailId: string): void {
    const email = this.emails.get(emailId);
    if (email) {
      if (!email.read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      this.emails.delete(emailId);
      this.notifyListeners();
    }
  }

  /**
   * Get a single email
   */
  getEmail(emailId: string): Email | null {
    return this.emails.get(emailId) || null;
  }

  /**
   * Get all emails (optionally filtered)
   */
  getEmails(filter: EmailFilterType = 'all'): Email[] {
    const allEmails = Array.from(this.emails.values());

    switch (filter) {
      case 'unread':
        return allEmails.filter(e => !e.read && !e.archived);
      case 'high-priority':
        return allEmails.filter(e => e.priority === 'high' && !e.archived);
      case 'archived':
        return allEmails.filter(e => e.archived);
      case 'all':
      default:
        return allEmails.filter(e => !e.archived);
    }
  }

  /**
   * Get emails sorted by received time (newest first)
   */
  getEmailsSorted(filter: EmailFilterType = 'all'): Email[] {
    return this.getEmails(filter).sort((a, b) => {
      return new Date(b.receivedTime).getTime() - new Date(a.receivedTime).getTime();
    });
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.unreadCount;
  }

  /**
   * Get emails requiring response
   */
  getEmailsRequiringResponse(): Email[] {
    return Array.from(this.emails.values()).filter(
      e => e.requiresResponse && !e.responded && !e.archived
    );
  }

  /**
   * Check if there are any high-priority unread emails
   */
  hasUrgentUnread(): boolean {
    return Array.from(this.emails.values()).some(
      e => e.priority === 'high' && !e.read && !e.archived
    );
  }

  /**
   * Clear all emails
   */
  clearAll(): void {
    this.emails.clear();
    this.unreadCount = 0;
    this.notifyListeners();
  }

  /**
   * Subscribe to email changes
   */
  subscribe(listener: (emails: Email[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const emails = this.getEmailsSorted();
    this.listeners.forEach(listener => listener(emails));
  }

  /**
   * Export state for saving
   */
  exportState(): any {
    const emailsData: any[] = [];

    this.emails.forEach(email => {
      emailsData.push({
        id: email.id,
        from: email.from,
        subject: email.subject,
        body: email.body,
        priority: email.priority,
        received: email.received,
        read: email.read,
        archived: email.archived,
        receivedTime: email.receivedTime,
        requiresResponse: email.requiresResponse,
        responded: email.responded,
      });
    });

    return {
      emails: emailsData,
      unreadCount: this.unreadCount,
    };
  }

  /**
   * Import state from save data
   */
  importState(data: any): void {
    if (!data) return;

    this.emails.clear();
    this.unreadCount = data.unreadCount || 0;

    if (data.emails) {
      data.emails.forEach((emailData: any) => {
        this.emails.set(emailData.id, emailData as Email);
      });
    }

    this.notifyListeners();
  }
}

// Export singleton instance
export const emailManager = new EmailManager();
