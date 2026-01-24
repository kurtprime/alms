/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
  convertToPixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ImagePlus,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Download,
  RefreshCw,
  Upload,
  ClipboardPaste,
} from "lucide-react";
import { cn } from "@/lib/utils";

function useDebounceEffect(
  fn: () => void,
  waitTime: number,
  deps: React.DependencyList,
) {
  useEffect(() => {
    const t = setTimeout(fn, waitTime);
    return () => clearTimeout(t);
  }, [deps, fn, waitTime]);
}

function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  scale = 1,
  rotate = 0,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const rotateRads = (rotate * Math.PI) / 180;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotateRads);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    cropX,
    cropY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width * scaleX,
    crop.height * scaleY,
  );
  ctx.restore();
}

interface ImageCropperProps {
  onCropComplete?: (croppedImage: string) => void;
  aspectRatio?: number;
  maxFileSizeMB?: number;
  circularCrop?: boolean;
  className?: string;
}

export function ImageCropper({
  onCropComplete,
  aspectRatio,
  maxFileSizeMB = 5,
  circularCrop = false,
  className,
}: ImageCropperProps) {
  const [imgSrc, setImgSrc] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null);
  const blobUrlRef = useRef("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(aspectRatio);

  // Handle clipboard paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (imgSrc) return; // Don't paste if already editing

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.indexOf("image") === 0) {
          e.preventDefault();
          setIsPasting(true);

          const file = item.getAsFile();
          if (file) {
            if (file.size > maxFileSizeMB * 1024 * 1024) {
              alert(`File size must be less than ${maxFileSizeMB}MB`);
              setIsPasting(false);
              return;
            }

            const reader = new FileReader();
            reader.onload = () => {
              setImgSrc(reader.result?.toString() || "");
              setIsPasting(false);
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [imgSrc, maxFileSizeMB]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      e.relatedTarget &&
      !dropZoneRef.current?.contains(e.relatedTarget as Node)
    ) {
      setIsDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFile = (file: File) => {
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxFileSizeMB}MB`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setCrop(undefined);
    const reader = new FileReader();
    reader.addEventListener("load", () =>
      setImgSrc(reader.result?.toString() || ""),
    );
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    if (aspect) {
      const newCrop = centerAspectCrop(width, height, aspect);
      setCrop(newCrop);
      setCompletedCrop(convertToPixelCrop(newCrop, width, height));
    } else {
      const newCrop: Crop = {
        unit: "%",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };
      setCrop(newCrop);
      setCompletedCrop(convertToPixelCrop(newCrop, width, height));
    }
  }

  function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
  ) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight,
      ),
      mediaWidth,
      mediaHeight,
    );
  }

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        canvasPreview(
          imgRef.current,
          previewCanvasRef.current,
          completedCrop,
          scale,
          rotate,
        );
      }
    },
    100,
    [completedCrop, scale, rotate],
  );

  async function handleDownload() {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!image || !previewCanvas || !completedCrop) {
      throw new Error("Crop canvas does not exist");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const offscreen = new OffscreenCanvas(
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
    );
    const ctx = offscreen.getContext("2d");
    if (!ctx) {
      throw new Error("No 2d context");
    }

    ctx.drawImage(
      previewCanvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
      0,
      0,
      offscreen.width,
      offscreen.height,
    );

    const blob = await offscreen.convertToBlob({
      type: "image/png",
    });

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    blobUrlRef.current = URL.createObjectURL(blob);

    if (hiddenAnchorRef.current) {
      hiddenAnchorRef.current.href = blobUrlRef.current;
      hiddenAnchorRef.current.click();
    }
  }

  async function handleApplyCrop() {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas || !completedCrop) return;

    const base64Image = previewCanvas.toDataURL("image/jpeg", 0.95);
    onCropComplete?.(base64Image);
  }

  function handleToggleAspectClick() {
    if (aspect) {
      setAspect(undefined);
      const newCrop: Crop = {
        unit: "%",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };
      setCrop(newCrop);
      if (imgRef.current) {
        setCompletedCrop(
          convertToPixelCrop(
            newCrop,
            imgRef.current.width,
            imgRef.current.height,
          ),
        );
      }
    } else {
      setAspect(16 / 9);
      if (imgRef.current) {
        const { width, height } = imgRef.current;
        const newCrop = centerAspectCrop(width, height, 16 / 9);
        setCrop(newCrop);
        setCompletedCrop(convertToPixelCrop(newCrop, width, height));
      }
    }
  }

  function reset() {
    setImgSrc("");
    setCrop(undefined);
    setScale(1);
    setRotate(0);
    setCompletedCrop(undefined);
    setIsDragActive(false);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
  }

  if (!imgSrc) {
    return (
      <Card className={cn(className, "h-80")}>
        <CardContent className="h-full p-6">
          <div
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "flex h-full cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed transition-all duration-200",
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              isPasting && "border-primary bg-primary/5",
            )}
          >
            <input
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-4"
            >
              <div className="relative">
                <div
                  className={cn(
                    "rounded-full bg-muted p-4 transition-transform duration-200",
                    isDragActive && "scale-110",
                  )}
                >
                  {isDragActive ? (
                    <Upload className="h-8 w-8 text-primary" />
                  ) : isPasting ? (
                    <ClipboardPaste className="h-8 w-8 text-primary animate-pulse" />
                  ) : (
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {isDragActive
                    ? "Drop image here"
                    : isPasting
                      ? "Pasting..."
                      : "Click, paste, or drop image here"}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Supports JPG, PNG, WebP (max {maxFileSizeMB}MB)
                </p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Crop Image
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale((z) => Math.max(0.5, z - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale((z) => Math.min(3, z + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRotate((r) => (r + 90) % 360)}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleAspectClick}
            >
              {aspect ? "Free" : "16:9"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            "relative overflow-hidden",
            circularCrop && "rounded-full w-fit",
          )}
        >
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            circularCrop={circularCrop}
            keepSelection={true}
            className="absolute left-1/2 transform -translate-x-1/2"
          >
            <img
              ref={imgRef}
              src={imgSrc}
              onLoad={onImageLoad}
              style={{
                transform: `scale(${scale}) rotate(${rotate}deg)`,
                maxWidth: "100%",
                maxHeight: "400px",
              }}
              alt="Crop me"
            />
          </ReactCrop>
        </div>

        <div className="flex items-center gap-4">
          <div className="space-y-2 flex-1">
            <Label>Zoom: {Math.round(scale * 100)}%</Label>
            <Slider
              value={[scale]}
              min={0.5}
              max={3}
              step={0.01}
              onValueChange={([z]) => setScale(z)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset} size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleApplyCrop}>Apply Crop</Button>
            <Button onClick={handleDownload} size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {completedCrop && (
          <div className="hidden">
            <canvas
              ref={previewCanvasRef}
              style={{
                border: "1px solid black",
                objectFit: "contain",
                maxWidth: "100%",
              }}
            />
            <a
              href="#hidden"
              ref={hiddenAnchorRef}
              download
              style={{
                position: "absolute",
                top: "-200vh",
                visibility: "hidden",
              }}
            >
              Hidden download
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
