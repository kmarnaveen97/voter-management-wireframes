"use client";

import type React from "react";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { Upload, FileText, Code } from "lucide-react";

interface UploadFormProps {
  onUploadStart: (jobId: string, filename: string) => void;
  uploadType: "pdf" | "json";
}

export function UploadForm({ onUploadStart, uploadType }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [electionName, setElectionName] = useState("");
  const [electionDate, setElectionDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const isValidType =
        uploadType === "pdf"
          ? droppedFile.type === "application/pdf"
          : droppedFile.type === "application/json";

      if (isValidType) {
        setFile(droppedFile);
      } else {
        alert(`Please upload a ${uploadType.toUpperCase()} file`);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      if (uploadType === "pdf") {
        const response = await api.uploadPDF(file, {
          election_name: electionName || undefined,
          election_date: electionDate || undefined,
        });
        onUploadStart(response.job_id, file.name);
      } else {
        const response = await api.uploadJSON(file);
        // JSON upload completes immediately, redirect to dashboard
        alert(`Successfully imported ${response.total_voters} voters!`);
        window.location.href = "/";
      }
    } catch (err) {
      console.error("[v0] Upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const fileAccept = uploadType === "pdf" ? ".pdf" : ".json";
  const FileIcon = uploadType === "pdf" ? FileText : Code;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {uploadType === "pdf"
            ? "Upload PDF Voter List"
            : "Upload JSON Voter Data"}
        </CardTitle>
        <CardDescription>
          {uploadType === "pdf"
            ? "Upload a PDF voter list to extract and import data using Gemini AI"
            : "Upload a hierarchical JSON file with pre-formatted voter data for instant import"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {uploadType === "pdf" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="electionName">Election Name</Label>
                <Input
                  id="electionName"
                  value={electionName}
                  onChange={(e) => setElectionName(e.target.value)}
                  placeholder="e.g., Lok Sabha 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="electionDate">Election Date</Label>
                <Input
                  id="electionDate"
                  type="date"
                  value={electionDate}
                  onChange={(e) => setElectionDate(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>{uploadType.toUpperCase()} File *</Label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/20"
              }`}
            >
              <input
                type="file"
                accept={fileAccept}
                onChange={handleFileChange}
                className="absolute inset-0 cursor-pointer opacity-0"
              />

              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileIcon className="h-12 w-12 text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="font-medium">
                    Drop your {uploadType.toUpperCase()} here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading
              ? "Uploading..."
              : uploadType === "pdf"
              ? "Upload & Start Extraction"
              : "Upload & Import Data"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
