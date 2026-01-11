"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Camera, Maximize2 } from "lucide-react";
import Image from "next/image";

interface ScreenshotViewerProps {
  screenshot_url: string;
  alt?: string;
}

export function ScreenshotViewer({ screenshot_url, alt = "Bug screenshot" }: ScreenshotViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Thumbnail */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative group cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
      >
        <div className="relative w-full aspect-video bg-muted">
          <Image
            src={screenshot_url}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white">
            <Maximize2 className="h-5 w-5" />
            <span className="text-sm font-medium">Click to enlarge</span>
          </div>
        </div>
      </button>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black/95">
            <Image
              src={screenshot_url}
              alt={alt}
              fill
              className="object-contain p-4"
              sizes="95vw"
              priority
            />
            {/* Screenshot icon badge */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 text-white text-sm">
              <Camera className="h-4 w-4" />
              <span>Screenshot</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
