const API_BASE = '/api';

class ApiClient {
  async _fetch(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API error');
    }

    return response.json();
  }

  // Work Log endpoints
  async createWorkLog(title, description, tags = []) {
    return this._fetch('/records', {
      method: 'POST',
      body: JSON.stringify({ title, description, tags }),
    });
  }

  async getWorkLogs() {
    // This might need to be adjusted based on how records are fetched
    return this._fetch('/records');
  }

  async getWorkLog(id) {
    return this._fetch(`/records/${id}`);
  }

  async updateWorkLog(id, updates) {
    return this._fetch(`/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteWorkLog(id) {
    return this._fetch(`/records/${id}`, {
      method: 'DELETE',
    });
  }

  // Project endpoints
  async createProject(name, description) {
    return this._fetch('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async getProjects() {
    return this._fetch('/projects');
  }

  async getProject(id) {
    return this._fetch(`/projects/${id}`);
  }

  async updateProject(id, updates) {
    return this._fetch(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id) {
    return this._fetch(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Session endpoints
  async addSessionToProject(projectId, session) {
    return this._fetch('/sessions', {
      method: 'POST',
      body: JSON.stringify({ projectId, ...session }),
    });
  }

  // File endpoints
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload error');
    }

    return response.json();
  }

  async getFile(fileId) {
    // Assuming files are stored with URLs, this might not be needed
    return null;
  }

  async getAudio(audioId) {
    return null;
  }
}

export const api = new ApiClient();
export default api;
