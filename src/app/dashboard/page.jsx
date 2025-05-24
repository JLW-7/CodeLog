'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TimeHeatmap from '@/components/TimeHeatmap';
import { format, subDays } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalTime: 0,
    totalSessions: 0,
    avgSessionTime: 0,
    activeProjects: 0,
  });

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const projects = await api.getProjects();
        const projectsData = Array.isArray(projects) ? projects : [];
        
        // Load sessions for each project
        const projectsWithSessions = await Promise.all(
          projectsData.map(async (project) => {
            try {
              const data = await api.getProject(project.id);
              return { ...project, sessions: data.sessions || [] };
            } catch (error) {
              console.error(`Failed to load sessions for project ${project.id}:`, error);
              return { ...project, sessions: [] };
            }
          })
        );

        setProjects(projectsWithSessions);

        // Calculate stats
        let totalTime = 0;
        let totalSessions = 0;
        let activeSessions = 0;

        for (const project of projectsWithSessions) {
          if (!project.sessions) continue;
          
          for (const session of project.sessions) {
            // Count total sessions
            totalSessions++;

            // Calculate session duration
            let sessionDuration = 0;
            if (session.duration) {
              sessionDuration = session.duration;
            } else if (session.end_time && session.start_time) {
              const end = new Date(session.end_time);
              const start = new Date(session.start_time);
              if (end.getFullYear() >= 2000 && start.getFullYear() >= 2000) {
                sessionDuration = end - start;
              }
            }
            totalTime += sessionDuration;

            // Check if session is active (ended in last hour)
            const endTime = new Date(session.end_time || session.endTime);
            if (endTime.getFullYear() >= 2000 && 
                endTime > new Date(Date.now() - 60 * 60 * 1000)) {
              activeSessions++;
            }
          }
        }

        const avgSessionTime = totalSessions > 0 ? totalTime / totalSessions : 0;

        setStats({
          totalTime,
          totalSessions,
          avgSessionTime,
          activeProjects: activeSessions,
        });
      } catch (error) {
        console.error('Failed to load projects:', error);
        if (error.message === 'Unauthorized') {
          localStorage.removeItem('zebra-token');
          router.push('/auth/login');
          toast.error('Session expired. Please login again.');
          return;
        }
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const formatDuration = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const hours = Math.floor(ms / 1000 / 60 / 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  if (error) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{error}</h3>
          <p className="text-gray-500 mb-4">Failed to load dashboard data.</p>
          <Button onClick={() => router.push('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {loading ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading dashboard...</h3>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono">{formatDuration(stats.totalTime)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl">{stats.totalSessions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg Session Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono">{formatDuration(stats.avgSessionTime)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl">{stats.activeProjects}</p>
          </CardContent>
        </Card>
      </div>

          {/* Time Heatmap */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <TimeHeatmap 
                sessions={projects.flatMap(project => project.sessions || [])} 
              />
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Recent Projects</h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {projects
                .sort((a, b) => {
                  const aLastSession = Math.max(...(a.sessions?.map(s => new Date(s.start_time || s.startTime)) || [0]));
                  const bLastSession = Math.max(...(b.sessions?.map(s => new Date(s.start_time || s.startTime)) || [0]));
                  return bLastSession - aLastSession;
                })
                .slice(0, 6)
                .map(project => {
                  const totalTime = (project.sessions || []).reduce((acc, session) => {
                    if (session.duration) {
                      return acc + session.duration;
                    }
                    if (session.end_time && session.start_time) {
                      const end = new Date(session.end_time);
                      const start = new Date(session.start_time);
                      if (end.getFullYear() >= 2000 && start.getFullYear() >= 2000) {
                        return acc + (end - start);
                      }
                    }
                    return acc;
                  }, 0);

                  const lastSession = project.sessions?.length > 0
                    ? new Date(Math.max(...project.sessions.map(s => new Date(s.start_time || s.startTime))))
                    : null;

                  return (
                    <Card 
                      key={project.id} 
                      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <CardHeader>
                        <CardTitle>{project.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500 mb-2">
                          {project.description || 'No description'}
                        </p>
                        <div className="text-sm">
                          <p><strong>Total Time:</strong> {formatDuration(totalTime)}</p>
                          <p><strong>Sessions:</strong> {project.sessions?.length || 0}</p>
                          <p><strong>Last Active:</strong> {lastSession ? lastSession.toLocaleDateString() : 'Never'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
