"use strict";
/**
 * Process Hunter
 * Finds the Antigravity language server process and extracts connection info
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessHunter = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class ProcessHunter {
    platform;
    targetProcess;
    constructor() {
        this.platform = process.platform;
        if (this.platform === 'win32') {
            this.targetProcess = 'language_server_windows_x64.exe';
        }
        else if (this.platform === 'darwin') {
            this.targetProcess = process.arch === 'arm64'
                ? 'language_server_macos_arm'
                : 'language_server_macos_x64';
        }
        else {
            this.targetProcess = 'language_server_linux_x64';
        }
    }
    async scanEnvironment(maxAttempts = 3) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const candidates = await this.findProcesses();
                // Verify each candidate by finding its actual listening port
                for (const candidate of candidates) {
                    const result = await this.verifyAndConnect(candidate);
                    if (result) {
                        return result;
                    }
                }
            }
            catch (error) {
                console.error(`Attempt ${i + 1} failed:`, error);
            }
            if (i < maxAttempts - 1) {
                await sleep(1000); // Wait 1 second before retry
            }
        }
        return null;
    }
    async verifyAndConnect(info) {
        const ports = await this.identifyPorts(info.pid);
        if (ports.length > 0) {
            const validPort = await this.verifyConnection(ports, info.csrfToken);
            if (validPort) {
                return {
                    pid: info.pid,
                    extensionPort: info.extensionPort,
                    connectPort: validPort,
                    csrfToken: info.csrfToken,
                };
            }
        }
        return null;
    }
    async identifyPorts(pid) {
        try {
            if (this.platform === 'win32') {
                return this.identifyWindowsPorts(pid);
            }
            else {
                return this.identifyUnixPorts(pid);
            }
        }
        catch (error) {
            console.error('Port identification failed:', error);
            return [];
        }
    }
    async identifyWindowsPorts(pid) {
        try {
            const { stdout: result } = await execAsync(`powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -OwningProcess ${pid} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalPort | Sort-Object -Unique"`);
            const ports = new Set();
            const matches = result.match(/\b\d{1,5}\b/g) || [];
            for (const value of matches) {
                const port = parseInt(value, 10);
                if (port > 0 && port <= 65535) {
                    ports.add(port);
                }
            }
            return Array.from(ports).sort((a, b) => a - b);
        }
        catch (error) {
            console.error('Failed to get Windows ports:', error);
            return [];
        }
    }
    async identifyUnixPorts(pid) {
        try {
            // Try lsof first
            try {
                const { stdout: result } = await execAsync(`lsof -Pan -p ${pid} -i`);
                return this.parseUnixPorts(result);
            }
            catch {
                // Fall back to ss
                const { stdout: result } = await execAsync(`ss -tlnp`);
                return this.parseUnixPortsFromSs(result, pid);
            }
        }
        catch (error) {
            console.error('Failed to get Unix ports:', error);
            return [];
        }
    }
    parseUnixPorts(output) {
        const ports = new Set();
        const lines = output.split('\n');
        for (const line of lines) {
            if (!line.includes('LISTEN'))
                continue;
            const match = line.match(/:(\d+)\s+\(LISTEN\)/);
            if (match) {
                const port = parseInt(match[1], 10);
                if (port > 0 && port <= 65535) {
                    ports.add(port);
                }
            }
        }
        return Array.from(ports).sort((a, b) => a - b);
    }
    parseUnixPortsFromSs(output, pid) {
        const ports = new Set();
        const lines = output.split('\n');
        for (const line of lines) {
            if (!line.includes(`pid=${pid}`))
                continue;
            const match = line.match(/127\.0\.0\.1:(\d+)/);
            if (match) {
                const port = parseInt(match[1], 10);
                if (port > 0 && port <= 65535) {
                    ports.add(port);
                }
            }
        }
        return Array.from(ports).sort((a, b) => a - b);
    }
    async verifyConnection(ports, token) {
        for (const port of ports) {
            if (await this.pingPort(port, token)) {
                return port;
            }
        }
        return null;
    }
    async pingPort(port, token) {
        return new Promise((resolve) => {
            const https = require('https');
            const options = {
                hostname: '127.0.0.1',
                port,
                path: '/exa.unleash_pb.UnleashService/GetUnleashData',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Codeium-Csrf-Token': token,
                    'Connect-Protocol-Version': '1',
                },
                rejectUnauthorized: false,
                timeout: 5000,
                agent: new https.Agent({
                    rejectUnauthorized: false,
                }),
            };
            const req = https.request(options, (res) => {
                // Accept 200 or 404 as valid (404 means server is responding, just wrong endpoint)
                // We'll use the actual endpoint in the reactor
                resolve(res.statusCode === 200 || res.statusCode === 404);
            });
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
            req.write(JSON.stringify({ wrapper_data: {} }));
            req.end();
        });
    }
    async findProcesses() {
        if (this.platform === 'win32') {
            return this.findWindowsProcesses();
        }
        else {
            return this.findUnixProcesses();
        }
    }
    async findWindowsProcesses() {
        const cmd = `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter 'name=''${this.targetProcess}''' | Select-Object ProcessId,CommandLine | ConvertTo-Json"`;
        try {
            const { stdout: result } = await execAsync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter 'name=''${this.targetProcess}''' | Select-Object ProcessId,CommandLine | ConvertTo-Json"`);
            return this.parseWindowsOutput(result);
        }
        catch (error) {
            console.error('Failed to execute Windows command:', error);
            return [];
        }
    }
    async findUnixProcesses() {
        try {
            // Use ps to find the process
            const { stdout: result } = await execAsync(`ps aux`);
            const lines = result.split('\n');
            const candidates = [];
            for (const line of lines) {
                if (!line.includes(this.targetProcess))
                    continue;
                if (!line.includes('--extension_server_port'))
                    continue;
                if (!line.includes('--csrf_token'))
                    continue;
                if (!line.includes('--app_data_dir antigravity'))
                    continue;
                const info = this.parseUnixLine(line);
                if (info) {
                    candidates.push(info);
                }
            }
            return candidates;
        }
        catch (error) {
            console.error('Failed to execute Unix command:', error);
            return [];
        }
    }
    parseWindowsOutput(stdout) {
        try {
            let data = JSON.parse(stdout.trim());
            if (!Array.isArray(data)) {
                data = [data];
            }
            const candidates = [];
            for (const item of data) {
                const commandLine = item.CommandLine || '';
                // Validate this is an Antigravity process
                if (!commandLine.includes('--extension_server_port'))
                    continue;
                if (!commandLine.includes('--csrf_token'))
                    continue;
                if (!/--app_data_dir\s+antigravity\b/i.test(commandLine))
                    continue;
                const pid = item.ProcessId;
                const portMatch = commandLine.match(/--extension_server_port[=\s]+(\d+)/);
                const tokenMatch = commandLine.match(/--csrf_token[=\s]+([a-f0-9-]+)/i);
                if (portMatch && tokenMatch) {
                    candidates.push({
                        pid,
                        extensionPort: parseInt(portMatch[1], 10),
                        csrfToken: tokenMatch[1],
                    });
                }
            }
            return candidates;
        }
        catch (error) {
            console.error('Failed to parse Windows output:', error);
            return [];
        }
    }
    parseUnixLine(line) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2)
            return null;
        const pid = parseInt(parts[1], 10);
        const commandLine = line;
        const portMatch = commandLine.match(/--extension_server_port[=\s]+(\d+)/);
        const tokenMatch = commandLine.match(/--csrf_token[=\s]+([a-f0-9-]+)/i);
        if (portMatch && tokenMatch) {
            return {
                pid,
                extensionPort: parseInt(portMatch[1], 10),
                csrfToken: tokenMatch[1],
            };
        }
        return null;
    }
}
exports.ProcessHunter = ProcessHunter;
//# sourceMappingURL=hunter.js.map