'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import useStore from '@/lib/store';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileIcon, Image as ImageIcon, FileAudio, Play, Pause, ExternalLink, Download } from 'lucide-react';
import ImagePreviewModal from '@/components/ImagePreviewModal';
import TimeHeatmap from '@/components/TimeHeatmap';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { getProjectById, getSessionsByProjectId } = useStore();
  const [project, setProject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [playingRecordId, setPlayingRecordId] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getProject(params.id);
        if (!data || !data.project) {
          setError('Project not found');
          toast.error('Project not found');
          return;
        }

        // Transform sessions data
        const validSessions = (data.sessions || []).map(session => ({
          id: session.id,
          startTime: session.start_time || session.startTime,
          endTime: session.end_time || session.endTime,
          duration: session.duration || 0,
          records: (session.records || []).map(record => ({
            id: record.id,
            text: record.text || '',
            gitLink: record.git_link || '',
            audioUrl: record.audio_url || '',
            timestamp: record.timestamp || record.created_at || new Date().toISOString(),
            files: (record.files || []).map(file => ({
              id: file.id,
              name: file.name || 'Unnamed file',
              url: file.url || '',
              type: file.type || 'application/octet-stream',
              size: file.size || 0
            }))
          }))
        })).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        setProject(data.project);
        setSessions(validSessions);
        toast.success('Project loaded successfully');
      } catch (error) {
        console.error('Failed to load project:', error);
        if (error.message === 'Unauthorized') {
          localStorage.removeItem('zebra-token');
          router.push('/auth/login');
          toast.error('Session expired. Please login again.');
          return;
        }
        const errorMsg = error.message || 'Failed to load project';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [params.id, router]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading project...</h3>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{error || 'Project not found'}</h3>
          <p className="text-gray-500 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  const totalTime = sessions.reduce((acc, session) => {
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
    if (session.endTime && session.startTime) {
      const end = new Date(session.endTime);
      const start = new Date(session.startTime);
      if (end.getFullYear() >= 2000 && start.getFullYear() >= 2000) {
        return acc + (end - start);
      }
    }
    return acc;
  }, 0);

  const formatDuration = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const hours = Math.floor(ms / 1000 / 60 / 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePlayAudio = async (recordId) => {
    try {
      // Stop current audio if playing
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        if (playingRecordId === recordId) {
          setPlayingRecordId(null);
          setAudioElement(null);
          return;
        }
      }

      const record = sessions
        .flatMap((s) => s.records)
        .find((r) => r.id === recordId);

      if (!record?.audioUrl || record.audioUrl === '00000000-0000-0000-0000-000000000000') {
        toast.error('No audio available for this record');
        return;
      }

      // Show loading state
      const loadingToast = toast.loading('Loading audio...');

      try {
        // Fetch audio blob from API
        const audioBlob = await api.getAudio(record.audioUrl);
        if (!audioBlob) {
          toast.error('Failed to load audio');
          return;
        }

        const audioUrl = URL.createObjectURL(audioBlob);

        // Create and play new audio
        const audio = new Audio(audioUrl);
        try {
          await audio.play();
          setAudioElement(audio);
          setPlayingRecordId(recordId);
          toast.success('Playing audio');

          // Reset when done playing and cleanup URL
          audio.onended = () => {
            setPlayingRecordId(null);
            setAudioElement(null);
            URL.revokeObjectURL(audioUrl);
          };
        } catch (error) {
          console.error('Failed to play audio:', error);
          URL.revokeObjectURL(audioUrl);
          toast.error('Failed to play audio');
          throw error;
        }
      } finally {
        toast.dismiss(loadingToast);
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      setPlayingRecordId(null);
      setAudioElement(null);
      toast.error('Failed to play audio');
    }
  };

  const handleFileClick = async (file) => {
    try {
      if (!file?.id || file.id === '00000000-0000-0000-0000-000000000000') {
        console.error('Invalid file ID');
        return;
      }

      // Show loading state
      const loadingToast = toast.loading('Loading file...');

      try {
        const blob = await api.getFile(file.id);
        if (!blob) {
          toast.error('Failed to load file');
          return;
        }

        const url = URL.createObjectURL(blob);

        if (file.type?.startsWith('image/')) {
          setSelectedImage({ ...file, previewUrl: url });
          toast.success('Image loaded');
        } else {
          // For non-image files, trigger download
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name || `file.${file.type?.split('/')[1] || 'unknown'}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('File downloaded');
        }
      } finally {
        toast.dismiss(loadingToast);
      }
    } catch (error) {
      console.error('Failed to handle file:', error);
      toast.error('Failed to load file');
    }
  };

  return (
    <>
      <ImagePreviewModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageData={selectedImage?.previewUrl}
        fileName={selectedImage?.name}
      />

      <div className="container mx-auto py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">{project.name}</h1>

        <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono">{formatDuration(totalTime)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl">{sessions.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Last Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                {sessions.length > 0
                  ? new Date(
                      Math.max(...sessions.filter(s => s.startTime).map(s => new Date(s.startTime)))
                    ).toLocaleDateString()
                  : 'Never'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <TimeHeatmap sessions={sessions} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Sessions</h2>
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-lg font-medium">
                      {new Date(session.startTime).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Duration: {formatDuration(session.duration)}
                    </p>
                  </div>
                </div>

                {session.records?.length > 0 && (
                  <div className="space-y-4">
                    {session.records.map((record, index) => (
                      <div
                        key={record.id || index}
                        className="border-l-2 border-gray-200 pl-4 ml-2"
                      >
                        {record.text && (
                          <p className="text-gray-600 mb-2">{record.text}</p>
                        )}
                        
                        {record.gitLink && (
                          <a
                            href={record.gitLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-500 hover:underline mb-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Commit
                          </a>
                        )}

                        {record.files?.length > 0 && (
                          <div className="space-y-2 mb-2">
                            <p className="text-sm font-medium text-gray-600">Attachments:</p>
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                              {record.files.map((file, fileIndex) => (
                                <div
                                  key={fileIndex}
                                  className="group relative flex flex-col gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200"
                                >
                                  <div 
                                    className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-gray-50 dark:bg-gray-700"
                                    onClick={() => handleFileClick(file)}
                                  >
                                    {file.type?.startsWith('image/') ? (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-300" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                                          <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                                            <Button variant="secondary" size="sm" className="shadow-lg">
                                              View Image
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : file.type?.startsWith('audio/') ? (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <FileAudio className="h-12 w-12 text-gray-400 dark:text-gray-300" />
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <FileIcon className="h-12 w-12 text-gray-400 dark:text-gray-300" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="p-3 flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-gray-900 dark:text-gray-200 truncate">
                                        {file.name || `File ${fileIndex + 1}`}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {file.type || 'Unknown type'}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleFileClick(file)}
                                      className="shrink-0 text-gray-500 dark:text-gray-300 hover:text-gray-900"
                                    >
                                      {file.type?.startsWith('image/') ? (
                                        <ImageIcon className="h-4 w-4" />
                                      ) : (
                                        <Download className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {record.audioUrl && (
                          <div className="flex items-center gap-2 mb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => handlePlayAudio(record.id)}
                            >
                              {playingRecordId === record.id ? (
                                <>
                                  <Pause className="h-4 w-4" />
                                  <span>Pause</span>
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4" />
                                  <span>Play</span>
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
