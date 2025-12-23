"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function WarRoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("War Room error:", error);
  }, [error]);

  const is3DError =
    error.message?.includes("WebGL") ||
    error.message?.includes("Three") ||
    error.message?.includes("canvas");

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle>War Room Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {is3DError ? (
            <>
              <p className="text-muted-foreground">
                Your browser may not support 3D rendering. Try the 2D version
                instead.
              </p>
              <Button asChild className="w-full">
                <Link href="/voters-management/war-room">
                  <Map className="h-4 w-4 mr-2" />
                  Open 2D War Room
                </Link>
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">
              Failed to load the War Room. Please try again.
            </p>
          )}
          {process.env.NODE_ENV === "development" && (
            <pre className="text-xs text-left bg-muted p-3 rounded overflow-auto max-h-32">
              {error.message}
            </pre>
          )}
          <div className="flex gap-2 justify-center">
            <Button variant="outline" asChild>
              <Link href="/voters-management">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <Button onClick={reset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
