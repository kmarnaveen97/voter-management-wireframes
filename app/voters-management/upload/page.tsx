"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { UploadForm } from "@/components/upload/upload-form";
import { ExtractionProgress } from "@/components/upload/extraction-progress";
import { ActiveJobsList } from "@/components/upload/active-jobs-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Code } from "lucide-react";
import { useUpload } from "@/contexts/upload-context";

export default function UploadPage() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const { activeJobs, addJob, isUploading } = useUpload();

  // On mount, check for any active jobs and show the most recent one
  useEffect(() => {
    if (!currentJobId && activeJobs.length > 0) {
      // Show the most recent active job
      const mostRecentJob = activeJobs[activeJobs.length - 1];
      setCurrentJobId(mostRecentJob.jobId);
    }
  }, [activeJobs, currentJobId]);

  const handleUploadStart = (jobId: string, filename: string) => {
    addJob(jobId, filename);
    setCurrentJobId(jobId);
  };

  return (
    <>
      <PageHeader
        title="Data Import"
        description="Upload voter lists in PDF or JSON format"
      />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Show active jobs indicator if there are background jobs */}
          {activeJobs.length > 0 && !currentJobId && (
            <ActiveJobsList onSelectJob={setCurrentJobId} />
          )}

          {currentJobId ? (
            <div className="space-y-4">
              <ExtractionProgress
                jobId={currentJobId}
                onBack={() => setCurrentJobId(null)}
              />

              {/* Show other active jobs if any */}
              {activeJobs.length > 1 && (
                <ActiveJobsList
                  onSelectJob={setCurrentJobId}
                  excludeJobId={currentJobId}
                />
              )}
            </div>
          ) : (
            <Tabs defaultValue="pdf" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pdf" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Upload PDF
                </TabsTrigger>
                <TabsTrigger value="json" className="gap-2">
                  <Code className="h-4 w-4" />
                  Upload JSON
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pdf" className="mt-6">
                <UploadForm
                  onUploadStart={handleUploadStart}
                  uploadType="pdf"
                />
              </TabsContent>
              <TabsContent value="json" className="mt-6">
                <UploadForm
                  onUploadStart={handleUploadStart}
                  uploadType="json"
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </>
  );
}
