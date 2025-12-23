"use client";

import React, { Suspense, Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Error boundary specifically for 3D components
class ThreeJSErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Three.js Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Card className="m-4">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                3D Visualization Unavailable
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                The 3D engine encountered a compatibility issue. This is a known
                issue with React 19 and Three.js. Please use the 2D War Room
                instead.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => this.setState({ hasError: false })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button asChild>
                  <a href="/voters-management/war-room">Open 2D War Room</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      );
    }

    return this.props.children;
  }
}

// Loading component
function Scene3DLoading() {
  return (
    <div className="flex-1 bg-slate-900 flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
        <div className="space-y-2">
          <p className="text-white/80 font-medium">Loading 3D Engine</p>
          <p className="text-white/50 text-sm">Initializing Three.js...</p>
        </div>
      </div>
    </div>
  );
}

// Dynamic import with error handling
const WarRoom3DSceneInternal = dynamic(
  () =>
    import("./war-room-3d-scene").catch((err) => {
      console.error("Failed to load 3D scene:", err);
      // Return a dummy component that will trigger the error boundary
      return {
        default: () => {
          throw new Error("Three.js failed to load");
        },
      };
    }),
  {
    ssr: false,
    loading: () => <Scene3DLoading />,
  }
);

// Exported wrapper component with error boundary
export function WarRoom3DSceneWrapper(
  props: React.ComponentProps<typeof WarRoom3DSceneInternal>
) {
  return (
    <ThreeJSErrorBoundary>
      <Suspense fallback={<Scene3DLoading />}>
        <WarRoom3DSceneInternal {...props} />
      </Suspense>
    </ThreeJSErrorBoundary>
  );
}

export default WarRoom3DSceneWrapper;
