"use strict";
/**
 * Antigravity Usage Fetcher
 * Fetches quota/usage information from local Antigravity process
 */
Object.defineProperty(exports, "__esModule", { value: true });
const hunter_1 = require("./hunter");
const reactor_1 = require("./reactor");
async function main() {
    console.log('🚀 Antigravity Usage Fetcher');
    console.log('============================\n');
    // Step 1: Find Antigravity process
    console.log('🔍 Scanning for Antigravity process...');
    const hunter = new hunter_1.ProcessHunter();
    const scanResult = await hunter.scanEnvironment(3);
    if (!scanResult) {
        console.error('❌ Failed to find Antigravity process');
        console.error('   Make sure Antigravity is running');
        process.exit(1);
    }
    console.log('✅ Found Antigravity process:');
    console.log(`   PID: ${scanResult.pid}`);
    console.log(`   Extension Port: ${scanResult.extensionPort}`);
    console.log(`   Connect Port: ${scanResult.connectPort}\n`);
    // Step 2: Connect to Antigravity API
    console.log('🔌 Connecting to Antigravity API...');
    const reactor = new reactor_1.ReactorCore();
    reactor.engage(scanResult.connectPort, scanResult.csrfToken);
    try {
        const snapshot = await reactor.fetchQuotaSnapshot();
        console.log('✅ Successfully fetched quota data\n');
        console.log('📊 Quota Information:');
        console.log('====================\n');
        if (snapshot.userInfo) {
            console.log('👤 User Info:');
            console.log(`   Email: ${snapshot.userInfo.email || 'N/A'}`);
            console.log(`   Tier: ${snapshot.userInfo.tier || 'N/A'}`);
            console.log(`   User ID: ${snapshot.userInfo.userId || 'N/A'}\n`);
        }
        console.log('🤖 Model Quotas:');
        snapshot.models.forEach((model, index) => {
            console.log(`\n${index + 1}. ${model.displayName}`);
            console.log(`   Model ID: ${model.modelId}`);
            console.log(`   Remaining: ${(model.remainingFraction * 100).toFixed(2)}%`);
            console.log(`   Reset Time: ${model.resetTime}`);
            console.log(`   Countdown: ${model.countdown || 'N/A'}`);
            if (model.capabilities) {
                const caps = [];
                if (model.capabilities.supportsImages)
                    caps.push('Images');
                if (model.capabilities.supportsVideo)
                    caps.push('Video');
                if (model.capabilities.supportsThinking)
                    caps.push('Thinking');
                if (caps.length > 0) {
                    console.log(`   Capabilities: ${caps.join(', ')}`);
                }
            }
        });
        if (snapshot.groups && snapshot.groups.length > 0) {
            console.log('\n\n📦 Quota Groups:');
            snapshot.groups.forEach((group, index) => {
                console.log(`\n${index + 1}. ${group.groupName}`);
                console.log(`   Models: ${group.modelIds.join(', ')}`);
                console.log(`   Remaining: ${(group.remainingFraction * 100).toFixed(2)}%`);
                console.log(`   Reset Time: ${group.resetTime}`);
            });
        }
        // Output JSON for programmatic use
        console.log('\n\n📄 JSON Output:');
        console.log('===============');
        console.log(JSON.stringify(snapshot, null, 2));
    }
    catch (error) {
        console.error('❌ Failed to fetch quota data:', error);
        process.exit(1);
    }
}
main().catch(console.error);
//# sourceMappingURL=index.js.map