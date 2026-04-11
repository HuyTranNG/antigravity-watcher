import * as https from 'https';
import { IncomingMessage } from 'http';

/**
 * Reactor Core
 * Communicates with Antigravity API to fetch quota data
 */

export class HighTrafficError extends Error {
  constructor(message: string = 'Our servers are experiencing high traffic right now, please try again in a minute') {
    super(message);
    this.name = 'HighTrafficError';
  }
}

export interface UserInfo {
  email?: string;
  tier?: string;
  userId?: string;
}

export interface ModelCapabilities {
  supportsImages?: boolean;
  supportsVideo?: boolean;
  supportsThinking?: boolean;
  thinkingBudget?: number;
  maxTokens?: number;
  maxOutputTokens?: number;
}

export interface ModelQuotaInfo {
  modelId: string;
  displayName: string;
  remainingFraction: number;
  resetTime: string;
  countdown?: string;
  isExhausted: boolean;
  capabilities?: ModelCapabilities;
}

export interface QuotaGroup {
  groupName: string;
  shortName: string;
  modelIds: string[];
  remainingFraction: number;
  resetTime: string;
  countdown?: string;
  isExhausted: boolean;
}

export interface QuotaSnapshot {
  userInfo?: UserInfo;
  models: ModelQuotaInfo[];
  groups?: QuotaGroup[];
  fetchedAt: number;
}

interface ClientModelConfig {
  label?: string;
  modelOrAlias?: {
    model?: string;
  };
  supportsImages?: boolean;
  supportsVideo?: boolean;
  supportsThinking?: boolean;
  thinkingBudget?: number;
  maxTokens?: number;
  maxOutputTokens?: number;
  isRecommended?: boolean;
  quotaInfo?: {
    remainingFraction?: number;
    resetTime?: string;
  };
  supportedMimeTypes?: Record<string, boolean>;
}

interface ServerUserStatusResponse {
  userStatus?: {
    name?: string;
    email?: string;
    planStatus?: {
      planInfo?: {
        teamsTier?: string;
        planName?: string;
      };
      availablePromptCredits?: number;
      availableFlowCredits?: number;
    };
    cascadeModelConfigData?: {
      clientModelConfigs?: ClientModelConfig[];
    };
  };
}

export class ReactorCore {
  private port: number = 0;
  private token: string = '';

  engage(port: number, token: string): void {
    this.port = port;
    this.token = token;
  }

  async fetchQuotaSnapshot(onRetry?: (attempt: number, delayMs: number) => void): Promise<QuotaSnapshot> {
    const response = await this.transmitWithRetry<ServerUserStatusResponse>(
      '/exa.language_server_pb.LanguageServerService/GetUserStatus',
      {},
      onRetry
    );

    return this.processResponse(response);
  }

  private async transmitWithRetry<T>(
    endpoint: string,
    payload: object,
    onRetry?: (attempt: number, delayMs: number) => void
  ): Promise<T> {
    let attempt = 0;
    const maxRetries = 5;

    while (true) {
      try {
        return await this.transmit<T>(endpoint, payload);
      } catch (error) {
        if (error instanceof HighTrafficError && attempt < maxRetries) {
          attempt++;
          const delayMs = Math.pow(2, attempt) * 1000;
          if (onRetry) {
            onRetry(attempt, delayMs);
          }
          await this.sleep(delayMs);
          continue;
        }
        throw error;
      }
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async transmit<T>(endpoint: string, payload: object): Promise<T> {
    if (!this.port) {
      throw new Error('Reactor not engaged - call engage() first');
    }

    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);

      const options = {
        hostname: '127.0.0.1',
        port: this.port,
        path: endpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'Connect-Protocol-Version': '1',
          'X-Codeium-Csrf-Token': this.token,
        },
        rejectUnauthorized: false,
        timeout: 10000,
        agent: new https.Agent({
          rejectUnauthorized: false,
        }),
      };

      const req = https.request(options, (res: IncomingMessage) => {
        let body = '';
        res.on('data', (chunk: Buffer | string) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode === 429) {
            reject(new HighTrafficError());
            return;
          }

          if (!body || body.trim().length === 0) {
            reject(new Error('Empty response from server'));
            return;
          }

          if (body.includes('Our servers are experiencing high traffic right now, please try again in a minute')) {
            reject(new HighTrafficError());
            return;
          }

          try {
            resolve(JSON.parse(body) as T);
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error}`));
          }
        });
      });

      req.on('error', (error: Error) => {
        reject(new Error(`Connection failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });

      req.write(data);
      req.end();
    });
  }

  private processResponse(response: ServerUserStatusResponse): QuotaSnapshot {
    const models: ModelQuotaInfo[] = [];
    const userStatus = response.userStatus;
    const modelConfigs = userStatus?.cascadeModelConfigData?.clientModelConfigs || [];

    const formatLocalTime = (isoString?: string) => {
      if (!isoString) return '';
      try {
        const date = new Date(isoString);
        return date.toLocaleString();
      } catch {
        return isoString || '';
      }
    };

    // Process each model's quota
    for (const config of modelConfigs) {
      const modelId = config.modelOrAlias?.model || '';
      const quotaInfo = config.quotaInfo;
      
      if (!modelId) continue;

      models.push({
        modelId,
        displayName: config.label || modelId,
        remainingFraction: quotaInfo?.remainingFraction ?? 0,
        resetTime: formatLocalTime(quotaInfo?.resetTime),
        countdown: this.calculateCountdown(quotaInfo?.resetTime),
        isExhausted: (quotaInfo?.remainingFraction ?? 0) === 0,
        capabilities: {
          supportsImages: config.supportsImages,
          supportsVideo: config.supportsVideo,
          supportsThinking: config.supportsThinking,
          thinkingBudget: config.thinkingBudget,
          maxTokens: config.maxTokens,
          maxOutputTokens: config.maxOutputTokens,
        },
      });
    }

    // Build model groups dynamically
    const geminiProModels = models
      .filter(m => {
        const name = m.displayName.toLowerCase();
        return name.includes("gemini") && name.includes("pro");
      })
      .map(m => m.displayName);

    const geminiFlashModels = models
      .filter(m => {
        const name = m.displayName.toLowerCase();
        return name.includes("gemini") && name.includes("flash");
      })
      .map(m => m.displayName);

    const claudeGptModels = models
      .filter(m => m.displayName.startsWith("Claude") || m.displayName.startsWith("GPT"))
      .map(m => m.displayName);

    const MODEL_GROUPS: Record<string, string[]> = {
      ...(geminiProModels.length > 0 ? { "Gemini Pro": geminiProModels } : {}),
      ...(geminiFlashModels.length > 0 ? { "Gemini Flash": geminiFlashModels } : {}),
      ...(claudeGptModels.length > 0 ? { "Claude-GPT": claudeGptModels } : {}),
    };
    const GROUP_SHORT_NAMES: Record<string, string> = {
      "Gemini Pro": "GP",
      "Gemini Flash": "GF",
      "Claude-GPT": "CG",
    };

    // Sort models by group order
    const groupNames = Object.keys(MODEL_GROUPS);
    const getGroupIndex = (displayName: string) => {
      const idx = groupNames.findIndex(g => MODEL_GROUPS[g].includes(displayName));
      return idx === -1 ? groupNames.length : idx;
    };
    models.sort((a, b) => getGroupIndex(a.displayName) - getGroupIndex(b.displayName));

    // Group models using MODEL_GROUPS
    const groups: QuotaGroup[] = [];
    const processedModelIds = new Set<string>();

    for (const [groupName, modelNames] of Object.entries(MODEL_GROUPS)) {
      const groupedModels = models.filter(m => modelNames.includes(m.displayName));
      if (groupedModels.length > 0) {
        const first = groupedModels[0];
        groups.push({
          groupName,
          shortName: GROUP_SHORT_NAMES[groupName] || groupName,
          modelIds: groupedModels.map(m => m.modelId),
          remainingFraction: first.remainingFraction,
          resetTime: first.resetTime,
          countdown: first.countdown,
          isExhausted: first.isExhausted,
        });
        groupedModels.forEach(m => processedModelIds.add(m.modelId));
      }
    }

    // Handle models not in any defined group
    for (const m of models) {
      if (!processedModelIds.has(m.modelId)) {
        groups.push({
          groupName: m.displayName,
          shortName: m.displayName,
          modelIds: [m.modelId],
          remainingFraction: m.remainingFraction,
          resetTime: m.resetTime,
          countdown: m.countdown,
          isExhausted: m.isExhausted,
        });
      }
    }

    return {
      userInfo: userStatus ? {
        email: userStatus.email,
        tier: userStatus.planStatus?.planInfo?.planName,
        userId: userStatus.planStatus?.planInfo?.teamsTier,
      } : undefined,
      models,
      groups,
      fetchedAt: Date.now(),
    };
  }

  private calculateCountdown(resetTime?: string): string | undefined {
    if (!resetTime) return undefined;

    try {
      const resetDate = new Date(resetTime);
      const now = new Date();
      const diff = resetDate.getTime() - now.getTime();

      if (diff <= 0) return 'Expired';

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return `${hours}h ${minutes}m`;
    } catch {
      return undefined;
    }
  }
}
