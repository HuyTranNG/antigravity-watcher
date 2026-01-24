/**
 * Process Hunter
 * Finds the Antigravity language server process and extracts connection info
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as https from 'https';
import { IncomingMessage } from 'http';

const execAsync = promisify(exec);

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface ProcessInfo {
  pid: number;
  extensionPort: number;
  csrfToken: string;
}

export interface EnvironmentScanResult {
  pid: number;
  extensionPort: number;
  connectPort: number;
  csrfToken: string;
}

export class ProcessHunter {
  private platform: string;
  private targetProcess: string;

  constructor() {
    this.platform = process.platform;
    
    if (this.platform === 'win32') {
      this.targetProcess = 'language_server_windows_x64.exe';
    } else if (this.platform === 'darwin') {
      this.targetProcess = process.arch === 'arm64' 
        ? 'language_server_macos_arm' 
        : 'language_server_macos_x64';
    } else {
      this.targetProcess = 'language_server_linux_x64';
    }
  }

  async scanEnvironment(maxAttempts: number = 3): Promise<EnvironmentScanResult | null> {
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
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
      }

      if (i < maxAttempts - 1) {
        await sleep(1000); // Wait 1 second before retry
      }
    }

    return null;
  }

  private async verifyAndConnect(info: ProcessInfo): Promise<EnvironmentScanResult | null> {
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

  private async identifyPorts(pid: number): Promise<number[]> {
    try {
      if (this.platform === 'win32') {
        return this.identifyWindowsPorts(pid);
      } else {
        return this.identifyUnixPorts(pid);
      }
    } catch (error) {
      console.error('Port identification failed:', error);
      return [];
    }
  }

  private async identifyWindowsPorts(pid: number): Promise<number[]> {
    try {
      const { stdout: result } = await execAsync(`powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -OwningProcess ${pid} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalPort | Sort-Object -Unique"`);
      
      const ports = new Set<number>();
      const matches = result.match(/\b\d{1,5}\b/g) || [];

      for (const value of matches) {
        const port = parseInt(value, 10);
        if (port > 0 && port <= 65535) {
          ports.add(port);
        }
      }

      return Array.from(ports).sort((a, b) => a - b);
    } catch (error) {
      console.error('Failed to get Windows ports:', error);
      return [];
    }
  }

  private async identifyUnixPorts(pid: number): Promise<number[]> {
    try {
      // Try lsof first
      try {
        const { stdout: result } = await execAsync(`lsof -Pan -p ${pid} -i`);
        return this.parseUnixPorts(result);
      } catch {
        // Fall back to ss
        const { stdout: result } = await execAsync(`ss -tlnp`);
        return this.parseUnixPortsFromSs(result, pid);
      }
    } catch (error) {
      console.error('Failed to get Unix ports:', error);
      return [];
    }
  }

  private parseUnixPorts(output: string): number[] {
    const ports = new Set<number>();
    const lines = output.split('\n');

    for (const line of lines) {
      if (!line.includes('LISTEN')) continue;
      
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

  private parseUnixPortsFromSs(output: string, pid: number): number[] {
    const ports = new Set<number>();
    const lines = output.split('\n');

    for (const line of lines) {
      if (!line.includes(`pid=${pid}`)) continue;
      
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

  private async verifyConnection(ports: number[], token: string): Promise<number | null> {
    for (const port of ports) {
      if (await this.pingPort(port, token)) {
        return port;
      }
    }
    return null;
  }

  private async pingPort(port: number, token: string): Promise<boolean> {
    return new Promise((resolve) => {
      
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

      const req = https.request(options, (res: IncomingMessage) => {
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


  private async findProcesses(): Promise<ProcessInfo[]> {
    if (this.platform === 'win32') {
      return this.findWindowsProcesses();
    } else {
      return this.findUnixProcesses();
    }
  }

  private async findWindowsProcesses(): Promise<ProcessInfo[]> {
    const cmd = `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter 'name=''${this.targetProcess}''' | Select-Object ProcessId,CommandLine | ConvertTo-Json"`;
    
    try {
      const { stdout: result } = await execAsync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter 'name=''${this.targetProcess}''' | Select-Object ProcessId,CommandLine | ConvertTo-Json"`);
      
      return this.parseWindowsOutput(result);
    } catch (error) {
      console.error('Failed to execute Windows command:', error);
      return [];
    }
  }

  private async findUnixProcesses(): Promise<ProcessInfo[]> {
    try {
      // Use ps to find the process
      const { stdout: result } = await execAsync(`ps aux`);
      const lines = result.split('\n');
      const candidates: ProcessInfo[] = [];

      for (const line of lines) {
        if (!line.includes(this.targetProcess)) continue;
        if (!line.includes('--extension_server_port')) continue;
        if (!line.includes('--csrf_token')) continue;
        if (!line.includes('--app_data_dir antigravity')) continue;

        const info = this.parseUnixLine(line);
        if (info) {
          candidates.push(info);
        }
      }

      return candidates;
    } catch (error) {
      console.error('Failed to execute Unix command:', error);
      return [];
    }
  }

  private parseWindowsOutput(stdout: string): ProcessInfo[] {
    try {
      let data = JSON.parse(stdout.trim());
      if (!Array.isArray(data)) {
        data = [data];
      }

      const candidates: ProcessInfo[] = [];

      for (const item of data) {
        const commandLine = item.CommandLine || '';
        
        // Validate this is an Antigravity process
        if (!commandLine.includes('--extension_server_port')) continue;
        if (!commandLine.includes('--csrf_token')) continue;
        if (!/--app_data_dir\s+antigravity\b/i.test(commandLine)) continue;

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
    } catch (error) {
      console.error('Failed to parse Windows output:', error);
      return [];
    }
  }

  private parseUnixLine(line: string): ProcessInfo | null {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) return null;

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
