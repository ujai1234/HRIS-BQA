import React, { useState, useEffect } from 'react';

interface BrandLogoProps {
  className?: string;
  imgClassName?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  imgClassName = '',
  alt = "Logo Baitul Qur'an Al-Ikhwan",
  size = 'md',
}) => {
  const [logoFormat, setLogoFormat] = useState<'jpeg' | 'jpg' | 'png' | 'fallback'>('jpeg');
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);

  const rawSrc =
    logoFormat === 'jpeg'
      ? '/logo.jpeg'
      : logoFormat === 'jpg'
      ? '/logo.jpg'
      : '/logo.png';

  useEffect(() => {
    if (logoFormat === 'fallback') {
      setIsProcessing(false);
      return;
    }

    let isMounted = true;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      if (!isMounted) return;

      try {
        const canvas = document.createElement('canvas');
        const width = img.naturalWidth || img.width || 200;
        const height = img.naturalHeight || img.height || 200;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setProcessedSrc(rawSrc);
          setIsProcessing(false);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Perform BFS Flood Fill from the corners to remove ONLY the outer background
        const queue: [number, number][] = [];
        const visited = new Uint8Array(width * height);

        const isWhite = (x: number, y: number) => {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          // Match white/near-white pixels with high tolerance for JPEG compression artifacts
          return a > 50 && r > 200 && g > 200 && b > 200;
        };

        const pushIfValid = (x: number, y: number) => {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const vIdx = y * width + x;
            if (visited[vIdx] === 0 && isWhite(x, y)) {
              visited[vIdx] = 1;
              queue.push([x, y]);
            }
          }
        };

        // Seed BFS from all four corners
        pushIfValid(0, 0);
        pushIfValid(width - 1, 0);
        pushIfValid(0, height - 1);
        pushIfValid(width - 1, height - 1);

        // Seed additional edge pixels to handle any disconnected borders
        for (let x = 0; x < width; x += 5) {
          pushIfValid(x, 0);
          pushIfValid(x, height - 1);
        }
        for (let y = 0; y < height; y += 5) {
          pushIfValid(0, y);
          pushIfValid(width - 1, y);
        }

        let head = 0;
        while (head < queue.length) {
          const [cx, cy] = queue[head++];
          
          // Explore 4-way connected neighbors
          pushIfValid(cx + 1, cy);
          pushIfValid(cx - 1, cy);
          pushIfValid(cx, cy + 1);
          pushIfValid(cx, cy - 1);
        }

        // Apply transparency only to the connected background pixels
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const vIdx = y * width + x;
            if (visited[vIdx] === 1) {
              const idx = vIdx * 4;
              data[idx + 3] = 0; // Turn background completely transparent
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentPng = canvas.toDataURL('image/png');
        setProcessedSrc(transparentPng);
      } catch {
        setProcessedSrc(rawSrc);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };

    img.onerror = () => {
      if (!isMounted) return;
      if (logoFormat === 'jpeg') {
        setLogoFormat('jpg');
      } else if (logoFormat === 'jpg') {
        setLogoFormat('png');
      } else {
        setLogoFormat('fallback');
        setIsProcessing(false);
      }
    };

    img.src = rawSrc;

    return () => {
      isMounted = false;
    };
  }, [logoFormat, rawSrc]);

  // Size mapping
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
    xl: 'w-32 h-32 sm:w-40 sm:h-40',
  }[size];

  if (logoFormat === 'fallback') {
    return (
      <div
        className={`${sizeClasses} rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-emerald-100 flex items-center justify-center font-bold text-lg tracking-widest shadow-lg border border-emerald-600/30 ${className}`}
      >
        BQA
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}>
      {processedSrc ? (
        <img
          src={processedSrc}
          alt={alt}
          className={`w-full h-full object-contain filter brightness-105 saturate-110 drop-shadow-[0_0_2px_rgba(255,255,255,0.95)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-105 ${imgClassName}`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <img
          src={rawSrc}
          alt={alt}
          className={`w-full h-full object-contain mix-blend-multiply dark:contrast-125 filter brightness-105 saturate-110 drop-shadow-[0_0_2px_rgba(255,255,255,0.95)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] ${imgClassName}`}
          onError={() => {
            if (logoFormat === 'jpeg') setLogoFormat('jpg');
            else if (logoFormat === 'jpg') setLogoFormat('png');
            else setLogoFormat('fallback');
          }}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};
