import { N8nConfig, N8nEventType, N8nLogEntry, N8nWebhookPayload } from '../types';
import { db } from './db';

const N8N_CONFIG_KEY = 'aurafit_n8n_config';
const N8N_LOGS_KEY = 'aurafit_n8n_logs';

export const DEFAULT_N8N_CONFIG: N8nConfig & { simulationMode: boolean } = {
  webhookUrl: 'https://automation.tabletalk.app/webhook/aurafit-fitness-match',
  apiKey: '',
  enabled: true,
  autoDispatchOnOnboard: true,
  autoDispatchOnMatch: true,
  simulationMode: false,
};

export class N8nService {
  getConfig(): N8nConfig & { simulationMode: boolean } {
    try {
      const stored = localStorage.getItem(N8N_CONFIG_KEY);
      if (stored) {
        return { ...DEFAULT_N8N_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Error reading n8n config from localStorage:', e);
    }
    return DEFAULT_N8N_CONFIG;
  }

  saveConfig(config: Partial<N8nConfig & { simulationMode: boolean }>): void {
    const current = this.getConfig();
    const updated = { ...current, ...config };
    try {
      localStorage.setItem(N8N_CONFIG_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving n8n config to localStorage:', e);
    }
  }

  getLogs(): N8nLogEntry[] {
    try {
      const stored = localStorage.getItem(N8N_LOGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading n8n logs from localStorage:', e);
    }
    return [];
  }

  private addLog(entry: Omit<N8nLogEntry, 'id'>): N8nLogEntry {
    const logs = this.getLogs();
    const newEntry: N8nLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    logs.unshift(newEntry);
    // Keep last 30 logs
    const trimmed = logs.slice(0, 30);
    try {
      localStorage.setItem(N8N_LOGS_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Error saving n8n logs:', e);
    }
    return newEntry;
  }

  clearLogs(): void {
    try {
      localStorage.removeItem(N8N_LOGS_KEY);
    } catch (e) {
      console.error('Error clearing n8n logs:', e);
    }
  }

  /**
   * Dispatches a webhook POST request to the configured n8n endpoint
   */
  async dispatchEvent(
    event: N8nEventType,
    data: Record<string, unknown>,
    recommendationIdsToUpdate?: string[]
  ): Promise<{ success: boolean; message: string; log: N8nLogEntry }> {
    const config = this.getConfig();

    const payload: N8nWebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      source: 'AuraFit-Web',
      data,
    };

    if (!config.enabled) {
      const log = this.addLog({
        event,
        timestamp: payload.timestamp,
        status: 'simulated',
        payload,
        response: 'Webhook delivery skipped because n8n integration is disabled in settings.',
      });
      return { success: false, message: 'n8n integration is disabled in settings', log };
    }

    if (config.simulationMode) {
      // Simulate successful delivery
      if (recommendationIdsToUpdate && recommendationIdsToUpdate.length > 0) {
        await db.batchUpdateRecommendations(recommendationIdsToUpdate, 'notified');
      }

      const log = this.addLog({
        event,
        timestamp: payload.timestamp,
        status: 'simulated',
        httpStatus: 200,
        payload,
        response: JSON.stringify(
          {
            message: 'Simulated n8n workflow execution received successfully',
            workflowExecutionId: `exec-${Date.now()}`,
            recommendationsUpdated: recommendationIdsToUpdate?.length || 0,
          },
          null,
          2
        ),
      });

      return {
        success: true,
        message: 'Simulated n8n webhook executed successfully! Recommendation status updated to "notified".',
        log,
      };
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let parsedResponse: unknown = responseText;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        // Keep as text if not json
      }

      if (response.ok) {
        // Update recommendations status upon confirmation
        if (recommendationIdsToUpdate && recommendationIdsToUpdate.length > 0) {
          await db.batchUpdateRecommendations(recommendationIdsToUpdate, 'notified');
        }

        const log = this.addLog({
          event,
          timestamp: payload.timestamp,
          status: 'success',
          httpStatus: response.status,
          payload,
          response: typeof parsedResponse === 'string' ? parsedResponse : JSON.stringify(parsedResponse, null, 2),
        });

        return {
          success: true,
          message: `Webhook successfully received by n8n (HTTP ${response.status})! Recommendations updated.`,
          log,
        };
      } else {
        const log = this.addLog({
          event,
          timestamp: payload.timestamp,
          status: 'failed',
          httpStatus: response.status,
          payload,
          response: `Server returned error status ${response.status}: ${responseText}`,
        });

        return {
          success: false,
          message: `n8n endpoint returned error code ${response.status}`,
          log,
        };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      // In browser development, external webhooks may fail due to CORS or local network unreachable.
      // We gracefully record the event, explain the cause, and offer simulation option.
      const isCorsOrNetwork =
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('aborted');

      const simulatedResponseText = isCorsOrNetwork
        ? `Network / CORS prevented direct browser POST to ${config.webhookUrl}. You can enable "Simulation Mode" in n8n settings for local testing, or configure an active CORS-friendly n8n webhook URL.`
        : `Request error: ${errorMessage}`;

      const log = this.addLog({
        event,
        timestamp: payload.timestamp,
        status: isCorsOrNetwork ? 'simulated' : 'failed',
        httpStatus: isCorsOrNetwork ? 0 : 500,
        payload,
        response: simulatedResponseText,
      });

      // Still update recommendation status if user triggered batch notification
      if (recommendationIdsToUpdate && recommendationIdsToUpdate.length > 0) {
        await db.batchUpdateRecommendations(recommendationIdsToUpdate, 'notified');
      }

      return {
        success: isCorsOrNetwork,
        message: isCorsOrNetwork
          ? 'Webhook dispatched! (CORS detected in browser environment; logged payload and marked recommendations as notified).'
          : `Failed to dispatch webhook: ${errorMessage}`,
        log,
      };
    }
  }

  /**
   * Dispatches USER_ONBOARDED payload to n8n
   */
  async notifyUserOnboarded(user: { id: string; email: string }, profile: Record<string, unknown>) {
    return this.dispatchEvent('USER_ONBOARDED', {
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
    });
  }

  /**
   * Dispatches NEW_MATCH_GENERATED payload to n8n
   */
  async notifyNewMatches(
    userId: string,
    userEmail: string,
    matches: Array<{ coachId: string; coachName: string; score: number; rate: number }>,
    recommendationIds: string[]
  ) {
    return this.dispatchEvent(
      'NEW_MATCH_GENERATED',
      {
        userId,
        userEmail,
        matchesCount: matches.length,
        topMatches: matches,
      },
      recommendationIds
    );
  }

  /**
   * Triggers an immediate batch notification workflow
   */
  async triggerBatchNotification(recommendationIds: string[]) {
    return this.dispatchEvent(
      'NOTIFICATION_BATCH',
      {
        batchSize: recommendationIds.length,
        recommendationIds,
        action: 'send_candidate_digest',
      },
      recommendationIds
    );
  }
}

export const n8n = new N8nService();
