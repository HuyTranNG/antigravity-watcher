"use strict";
/**
 * Reactor Core
 * Communicates with Antigravity API to fetch quota data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactorCore = void 0;
class ReactorCore {
    port = 0;
    token = '';
    engage(port, token) {
        this.port = port;
        this.token = token;
    }
    async fetchQuotaSnapshot() {
        const response = await this.transmit('/exa.language_server_pb.LanguageServerService/GetUserStatus', {});
        return this.processResponse(response);
    }
    async transmit(endpoint, payload) {
        if (!this.port) {
            throw new Error('Reactor not engaged - call engage() first');
        }
        return new Promise((resolve, reject) => {
            const https = require('https');
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
            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => (body += chunk));
                res.on('end', () => {
                    if (!body || body.trim().length === 0) {
                        reject(new Error('Empty response from server'));
                        return;
                    }
                    try {
                        resolve(JSON.parse(body));
                    }
                    catch (error) {
                        reject(new Error(`Failed to parse JSON: ${error}`));
                    }
                });
            });
            req.on('error', (error) => {
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
    processResponse(response) {
        const models = [];
        const userStatus = response.userStatus;
        const modelConfigs = userStatus?.cascadeModelConfigData?.clientModelConfigs || [];
        // Process each model's quota
        for (const config of modelConfigs) {
            const modelId = config.modelOrAlias?.model || '';
            const quotaInfo = config.quotaInfo;
            if (!modelId)
                continue;
            models.push({
                modelId,
                displayName: config.label || modelId,
                remainingFraction: quotaInfo?.remainingFraction ?? 1,
                resetTime: quotaInfo?.resetTime || '',
                countdown: this.calculateCountdown(quotaInfo?.resetTime),
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
        // Sort by remaining fraction (lowest first)
        models.sort((a, b) => a.remainingFraction - b.remainingFraction);
        return {
            userInfo: userStatus ? {
                email: userStatus.email,
                tier: userStatus.planStatus?.planInfo?.planName,
                userId: userStatus.planStatus?.planInfo?.teamsTier,
            } : undefined,
            models,
            fetchedAt: Date.now(),
        };
    }
    calculateCountdown(resetTime) {
        if (!resetTime)
            return undefined;
        try {
            const resetDate = new Date(resetTime);
            const now = new Date();
            const diff = resetDate.getTime() - now.getTime();
            if (diff <= 0)
                return 'Expired';
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m`;
        }
        catch {
            return undefined;
        }
    }
}
exports.ReactorCore = ReactorCore;
//# sourceMappingURL=reactor.js.map