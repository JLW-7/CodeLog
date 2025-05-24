'use client';

import { useRouter } from 'next/navigation';
import useStore from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, getSessionsByProjectId, isLoading, error } = useStore();

  const getProjectStats = (projectId) => {
    const sessions = getSessionsByProjectId(projectId);
    const totalTime = sessions.reduce((acc, session) => acc + (session.duration || 0), 0);
    return {
      sessions: sessions.length,
      totalTime,
      lastActive: sessions.length > 0 
        ? Math.max(...sessions.map(s => s.startTime))
        : null
    };
  };

  const formatDuration = (ms) => {
    const hours = Math.floor(ms / 1000 / 60 / 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Projects</h1>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading projects...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-red-600 mb-2">Error loading projects</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      )}

      {!isLoading && !error && <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {projects.map(project => {
          const stats = getProjectStats(project.id);
          return (
            <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/projects/${project.id}`)}>
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Time</dt>
                    <dd className="text-2xl font-semibold">{formatDuration(stats.totalTime)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Sessions</dt>
                    <dd className="text-2xl font-semibold">{stats.sessions}</dd>
                  </div>
                </dl>
                <p className="text-sm text-gray-500 mt-4">
                  {stats.lastActive 
                    ? `Last active: ${new Date(stats.lastActive).toLocaleDateString()}`
                    : 'No sessions yet'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>}

      {!isLoading && !error && projects.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-4">Create your first project to get started</p>
          <Button onClick={() => router.push('/')}>Create Project</Button>
        </div>
      )}
    </div>
  );
}
