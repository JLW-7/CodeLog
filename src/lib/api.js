const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

class ApiClient {
  constructor() {
    // No auth token or storage handling here anymore
  }

  async request(endpoint, options = {}, isBlob = false) {
    endpoint = endpoint.replace(/^\/+/, '');
    const url = `${API_BASE_URL}/${endpoint}`;

    // Simple headers: only add JSON Content-Type if body exists and not overridden
    const headers = {
      ...(options.body && !options.headers?.['Content-Type'] ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, body:`, errorText);
        throw new Error(`Request failed: ${response.statusText || response.status}`);
      }

      if (isBlob) {
        return await response.blob();
      }

      const text = await response.text();

      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Invalid JSON response from server');
      }

      return data;
    } catch (error) {
      console.error(`Error in request to ${endpoint}:`, error);
      throw error;
    }
  }

  // Work log endpoints
  async createWorkLog(title, description, tags = []) {
    return this.request('/logs', {
      method: 'POST',
      body: JSON.stringify({ title, description, tags }),
    });
  }

  async getWorkLogs() {
    return this.request('/logs');
  }

  async getWorkLog(id) {
    return this.request(`/logs/${id}`);
  }

  async updateWorkLog(id, updates) {
    return this.request(`/logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteWorkLog(id) {
    return this.request(`/logs/${id}`, {
      method: 'DELETE',
    });
  }

  // Project endpoints
  async createProject(name, description) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async getProjects() {
    return this.request('/projects');
  }

  async getProject(id) {
    try {
      const project = await this.request(`/projects/${id}`);
      if (!project) return null;

      const sessions = (project.sessions || []).map(session => ({
        ...session,
        startTime: session.start_time || session.startTime,
        endTime: session.end_time || session.endTime,
        duration: session.duration || (session.end_time && session.start_time
          ? new Date(session.end_time) - new Date(session.start_time)
          : 0),
        records: (session.records || []).map(record => ({
          ...record,
          files: (record.files || []).map(file => ({
            ...file,
            id: file.id || file.url?.split('/').pop(),
            url: file.url || (file.id && file.id !== '00000000-0000-0000-0000-000000000000'
              ? `${API_BASE_URL}/files/${file.id}`
              : null),
            type: file.type || file.mime_type || 'unknown',
          })).filter(f => f.id && f.id !== '00000000-0000-0000-0000-000000000000'),
          audioUrl: record.audio_url || (record.id && record.id !== '00000000-0000-0000-0000-000000000000'
            ? `${API_BASE_URL}/audio/${record.id}`
            : null),
          timestamp: record.timestamp || record.created_at || new Date().toISOString(),
        })),
      }));

      return {
        project: {
          ...project,
          sessions,
        },
        sessions,
      };
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  }

  async getFile(fileId) {
    if (!fileId || fileId === '00000000-0000-0000-0000-000000000000') {
      console.error('Invalid file ID');
      return null;
    }
    try {
      return await this.request(`files/${fileId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream',
        },
      }, true);
    } catch (error) {
      console.error('Error fetching file:', error);
      return null;
    }
  }

  async getAudio(audioId) {
    if (!audioId || audioId === '00000000-0000-0000-0000-000000000000') {
      console.error('Invalid audio ID');
      return null;
    }
    try {
      audioId = audioId.replace(/^\/audio\//, '').replace(/^audio\//, '');
      return await this.request(`audio/${audioId}`, {
        method: 'GET',
        headers: {
          'Accept': 'audio/*',
        },
      }, true);
    } catch (error) {
      console.error('Error fetching audio:', error);
      return null;
    }
  }

  async updateProject(id, updates) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
export default api;
