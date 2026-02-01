/**
 * File Service
 *
 * Handles communication with the Bun server for file I/O
 */

interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface FileData {
  path: string;
  content: string;
  size: number;
  modified: Date;
}

class FileService {
  private baseURL = 'http://localhost:3001/api';

  /**
   * List files in a directory
   */
  async listFiles(dir?: string): Promise<string[]> {
    const url = new URL(`${this.baseURL}/files`);
    if (dir) {
      url.searchParams.set('dir', dir);
    }

    const response = await fetch(url);
    const result: APIResponse<string[]> = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to list files');
    }

    return result.data || [];
  }

  /**
   * Read a file
   */
  async readFile(path: string): Promise<FileData> {
    const url = new URL(`${this.baseURL}/file`);
    url.searchParams.set('path', path);

    const response = await fetch(url);
    const result: APIResponse<FileData> = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to read file');
    }

    return result.data!;
  }

  /**
   * Write a file
   */
  async writeFile(path: string, content: string): Promise<void> {
    console.log(`[FileService] Writing to: ${path} (${content.length} bytes)`);

    const response = await fetch(`${this.baseURL}/file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, content }),
    });

    const result: APIResponse = await response.json();
    console.log(`[FileService] Write response:`, result);

    if (!result.success) {
      throw new Error(result.error || 'Failed to write file');
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(path: string): Promise<void> {
    const url = new URL(`${this.baseURL}/file`);
    url.searchParams.set('path', path);

    const response = await fetch(url, { method: 'DELETE' });
    const result: APIResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete file');
    }
  }

  /**
   * Check if server is reachable
   */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/files`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const fileService = new FileService();
