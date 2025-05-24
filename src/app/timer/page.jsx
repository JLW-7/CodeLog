'use client';

import Timer from '@/components/Timer';
import ProjectSelector from '@/components/ProjectSelector';
import RecordInput from '@/components/RecordInput';
import { Card, CardContent } from '@/components/ui/card';

export default function TimerPage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <ProjectSelector />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Timer />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <RecordInput />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
