import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from './api';

const useStore = create(
  persist(
    // Initial state and actions
    (set, get) => ({
      // Timer state
      isRunning: false,
      startTime: null,
      currentSession: null,
      lastElapsedTime: 0, // Store the elapsed time when paused

      // Projects state
      projects: [],
      sessions: [],
      records: [],
      isLoading: false,
      error: null,
      
      // Files and audio state
      files: {}, // { recordId: { files: [], audioBlob: Blob } }
      maxStoredFiles: 10, // Maximum number of files to store in memory

      // Timer actions
      startTimer: async () => {
        const lastProject = get().projects[get().projects.length - 1]; // Automatically select the last project
        if (!lastProject) {
          console.error('No project selected');
          return;
        }

        const now = new Date();
        const session = {
          projectId: lastProject.id,
          startTime: now.toISOString(),
          duration: 0,
          records: [],
        };

        console.log('Starting new session:', session);

        set({
          isRunning: true,
          startTime: now.getTime(),
          currentSession: session,
          lastElapsedTime: 0,
        });
      },

      stopTimer: async () => {
        const { currentSession, startTime, lastElapsedTime } = get();
        if (!currentSession || !startTime) {
          console.error('No active session');
          return;
        }

        const duration = lastElapsedTime + (Date.now() - startTime);

        try {
          const sessionToSave = {
            ...currentSession,
            endTime: new Date().toISOString(),
            duration,
            records: currentSession.records.map(record => ({
              text: record.text || '',
              gitLink: record.gitLink || '',
              files: (record.files || []).map(file => ({
                name: file.name,
                url: file.url,
                type: file.type,
                size: file.size,
              })),
              audioUrl: record.audioUrl || '',
              timestamp: record.timestamp || new Date().toISOString(),
            })),
          };

          await api.addSessionToProject(currentSession.projectId, sessionToSave);

          await get().loadProjects();

          set((state) => ({
            isRunning: false,
            lastElapsedTime: duration,
            startTime: null,
            currentSession: null,
            sessions: [...state.sessions, { ...currentSession, duration }],
            error: null,
          }));
        } catch (error) {
          console.error('Failed to save session:', error);
          set({
            isRunning: false,
            lastElapsedTime: duration,
            startTime: null,
            currentSession: null,
            error: 'Failed to save session',
          });
        }
      },


      // Project actions
      addProject: async (name, description = '') => {
        try {
          const project = await api.createProject(name, description);
          set((state) => ({
            projects: [...state.projects, project],
            currentProject: project,
          }));
          return project;
        } catch (error) {
          console.error('Failed to create project:', error);
          throw error;
        }
      },

      loadProjects: async () => {
        set({ isLoading: true, error: null });
        try {
          const projects = await api.getProjects();
          
          // Load sessions for each project
          const projectsWithSessions = await Promise.all(
            projects.map(async (project) => {
              try {
                const data = await api.getProject(project.id);
                return { ...project, sessions: data.sessions || [] };
              } catch (error) {
                console.error(`Failed to load sessions for project ${project.id}:`, error);
                return { ...project, sessions: [] };
              }
            })
          );

          set({ 
            projects: projectsWithSessions,
            sessions: projectsWithSessions.flatMap(p => p.sessions),
            currentProject: projectsWithSessions.length > 0 ? projectsWithSessions[0] : null,
            isLoading: false,
            error: null
          });
          return projectsWithSessions;
        } catch (error) {
          console.error('Failed to load projects:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to load projects'
          });
          throw error;
        }
      },

      setCurrentProject: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (project) {
          set({ currentProject: project });
        }
      },

      getCurrentProject: () => {
        const { currentProject, projects } = get();
        if (currentProject) return currentProject;
        if (projects.length > 0) {
          const lastProject = projects[projects.length - 1];
          set({ currentProject: lastProject });
          return lastProject;
        }
        return null;
      },

      getProjectById: (id) => {
        return get().projects.find((p) => p.id === id);
      },

      // Session actions
      getSessionsByProjectId: (projectId) => {
        return get()
          .sessions.filter((s) => s.projectId === projectId)
          .sort((a, b) => b.startTime - a.startTime);
      },

      // Record actions
      addRecord: async (record) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const newRecord = {
          ...record,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(), // Convert to ISO string instead of timestamp
        };

        // Store files and audio in the files object
        if ((record.files?.length > 0 || record.audioBlob) && newRecord.id) {
          set((state) => {
            // Get all record IDs sorted by timestamp
            const recordIds = Object.keys(state.files);
            
            // If we have more than maxStoredFiles, remove the oldest ones
            const filesToKeep = {};
            if (recordIds.length >= state.maxStoredFiles) {
              recordIds
                .sort((a, b) => state.files[b].timestamp - state.files[a].timestamp)
                .slice(0, state.maxStoredFiles - 1)
                .forEach(id => {
                  filesToKeep[id] = state.files[id];
                });
            } else {
              Object.assign(filesToKeep, state.files);
            }

            // Add the new record
            filesToKeep[newRecord.id] = {
              files: record.files || [],
              audioBlob: record.audioBlob,
              timestamp: newRecord.timestamp
            };

            return { files: filesToKeep };
          });
        }

        set((state) => ({
          currentSession: {
            ...state.currentSession,
            records: [...(state.currentSession.records || []), newRecord],
          },
        }));
      },

      // File and audio actions
      getRecordFiles: (recordId) => {
        return get().files[recordId]?.files || [];
      },

      getRecordAudio: (recordId) => {
        return get().files[recordId]?.audioBlob || null;
      },
    }),
    {
      name: 'zebra-store',
      version: 2,
      migrate: (persistedState, version) => {
        if (version === 1) {
          return {
            ...persistedState,
            projects: [],
            currentProject: null,
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        // Only persist essential data
        projects: state.projects,
        sessions: state.sessions,
        currentProject: state.currentProject,
        isRunning: state.isRunning,
        startTime: state.startTime,
        currentSession: state.currentSession && {
          ...state.currentSession,
          // Don't persist files/audio in the session
          records: state.currentSession.records?.map(r => ({
            ...r,
            files: [],
            audioBlob: null
          })) || []
        },
        lastElapsedTime: state.lastElapsedTime,
        maxStoredFiles: state.maxStoredFiles
      }),
    }
  )
);

export default useStore;
