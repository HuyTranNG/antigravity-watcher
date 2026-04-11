/**
 * Antigravity watcher Usage Fetcher
 * Fetches quota/usage information from local Antigravity process
 */

import { ProcessHunter } from './hunter';
import { ReactorCore } from './reactor';

async function main() {
  console.log('🚀 Antigravity watcher Usage Fetcher');
  console.log('============================\n');

  // Handle command line arguments
  const args = process.argv.slice(2);
  const enableRetry = !args.includes('--no-retry');

  if (!enableRetry) {
    console.log('⚠️ Automatic retry disabled via --no-retry flag\n');
  }

  // Step 1: Find Antigravity process
  console.log('🔍 Scanning for Antigravity process...');
  const hunter = new ProcessHunter();
  const scanResults = await hunter.scanEnvironment(3);

  if (scanResults.length === 0) {
    console.error('❌ Failed to find any Antigravity process');
    console.error('   Make sure Antigravity is running');
    process.exit(1);
  }

  console.log(`✅ Found ${scanResults.length} Antigravity process(es):\n`);

  for (const scanResult of scanResults) {
    console.log(`----------------------------------------`);
    console.log(`💼 Process Info (PID: ${scanResult.pid}):`);
    console.log(`   Extension Port: ${scanResult.extensionPort}`);
    console.log(`   Connect Port: ${scanResult.connectPort}\n`);

    // Step 2: Connect to Antigravity API
    console.log('🔌 Connecting to Antigravity API...');
    const reactor = new ReactorCore();
    reactor.engage(scanResult.connectPort, scanResult.csrfToken);

    try {
      const snapshot = await reactor.fetchQuotaSnapshot({ 
        enableRetry,
        onRetry: (attempt, delayMs) => {
          console.log(`   🔄 Antigravity is busy. Retrying (${attempt}/5) in ${delayMs / 1000}s...`);
        }
      });
      
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
          if (model.capabilities.supportsImages) caps.push('Images');
          if (model.capabilities.supportsVideo) caps.push('Video');
          if (model.capabilities.supportsThinking) caps.push('Thinking');
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

    } catch (error) {
      console.error(`❌ Failed to fetch quota data for PID ${scanResult.pid}:`, error);
    }
    console.log(`----------------------------------------\n`);
  }
}

main().catch(console.error);
