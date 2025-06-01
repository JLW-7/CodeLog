const STORAGE_KEYS = {
  PROJECTS: 'mock_projects',
  LOGS: 'mock_logs',
};

function getStored(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function setStored(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return crypto.randomUUID?.() || Math.random().toString(36).substring(2, 10);
}

class ApiClient {
  // Work Log endpoints
  async createWorkLog(title, description, tags = []) {
    const logs = getStored(STORAGE_KEYS.LOGS);
    const newLog = {
      id: generateId(),
      title,
      description,
      tags,
      createdAt: new Date().toISOString(),
    };
    logs.push(newLog);
    setStored(STORAGE_KEYS.LOGS, logs);
    return newLog;
  }

  async getWorkLogs() {
    return getStored(STORAGE_KEYS.LOGS);
  }

  async getWorkLog(id) {
    const logs = getStored(STORAGE_KEYS.LOGS);
    return logs.find(log => log.id === id) || null;
  }

  async updateWorkLog(id, updates) {
    const logs = getStored(STORAGE_KEYS.LOGS);
    const index = logs.findIndex(log => log.id === id);
    if (index === -1) return null;

    logs[index] = { ...logs[index], ...updates };
    setStored(STORAGE_KEYS.LOGS, logs);
    return logs[index];
  }

  async deleteWorkLog(id) {
    const logs = getStored(STORAGE_KEYS.LOGS);
    const updated = logs.filter(log => log.id !== id);
    setStored(STORAGE_KEYS.LOGS, updated);
    return true;
  }

  // Project endpoints
  async createProject(name, description) {
    const projects = getStored(STORAGE_KEYS.PROJECTS);
    const newProject = {
      id: generateId(),
      name,
      description,
      sessions: [],
    };
    projects.push(newProject);
    setStored(STORAGE_KEYS.PROJECTS, projects);
    return newProject;
  }

  async getProjects() {
    return getStored(STORAGE_KEYS.PROJECTS);
  }

  async getProject(id) {
    const projects = getStored(STORAGE_KEYS.PROJECTS);
    const project = projects.find(p => p.id === id);
    if (!project) return null;

    const sessions = (project.sessions || []).map(session => ({
      ...session,
      startTime: session.startTime || null,
      endTime: session.endTime || null,
      duration: session.duration || 0,
      records: session.records || [],
    }));

    return {
      project: {
        ...project,
        sessions,
      },
      sessions,
    };
  }

  async updateProject(id, updates) {
    const projects = getStored(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;

    projects[index] = { ...projects[index], ...updates };
    setStored(STORAGE_KEYS.PROJECTS, projects);
    return projects[index];
  }

  async deleteProject(id) {
    const projects = getStored(STORAGE_KEYS.PROJECTS);
    const updated = projects.filter(p => p.id !== id);
    setStored(STORAGE_KEYS.PROJECTS, updated);
    return true;
  }

  // Placeholder for file/audio APIs
  async getFile(fileId) {
    console.warn('Mocked getFile called — no file system');
    return null;
  }

  async getAudio(audioId) {
    console.warn('Mocked getAudio called — no audio system');
    return null;
  }

  async addSessionToProject(projectId, session) {
    const projects = getStored(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex(p => p.id === projectId);
    if (index === -1) return null;

    const project = projects[index];
    project.sessions = project.sessions || [];
    project.sessions.push(session);

    projects[index] = project;
    setStored(STORAGE_KEYS.PROJECTS, projects);
    return session;
  }
}

export const api = new ApiClient();
export default api;
