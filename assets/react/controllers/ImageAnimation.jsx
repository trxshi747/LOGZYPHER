
import { useEffect, useRef, useState } from "react";

const ImageAnimation = ({
  src,
  baseIntensity = 10,
  hoverIntensity = 2,
  enableHover = true,
  className = "",
  width = 60,
  height = 60
}) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(new Image());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let animationFrameId;
    let isCancelled = false;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = imgRef.current;
    img.src = src;
    img.crossOrigin = "Anonymous";

    const handleLoad = () => {
      if (isCancelled) return;
      setIsLoaded(true);
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dessiner l'image originale (pour référence)
      ctx.drawImage(img, 0, 0, width, height);

      let isHovering = false;
      const fuzzRange = 20;

      const run = () => {
        if (isCancelled) return;
        
        ctx.clearRect(0, 0, width, height);
        const intensity = isHovering ? hoverIntensity : baseIntensity;
        
        for (let j = 0; j < height; j++) {
          const dx = Math.floor(intensity * (Math.random() - 0.5) * fuzzRange);
          ctx.drawImage(
            img,
            0, j, width, 1,
            dx, j, width, 1
          );
        }
        animationFrameId = window.requestAnimationFrame(run);
      };

      run();

      // Gestion des événements hover
      const handleMouseEnter = () => {
        if (!enableHover) return;
        isHovering = true;
      };

      const handleMouseLeave = () => {
        isHovering = false;
      };

      if (enableHover) {
        canvas.addEventListener('mouseenter', handleMouseEnter);
        canvas.addEventListener('mouseleave', handleMouseLeave);
      }

      const cleanup = () => {
        window.cancelAnimationFrame(animationFrameId);
        if (enableHover) {
          canvas.removeEventListener('mouseenter', handleMouseEnter);
          canvas.removeEventListener('mouseleave', handleMouseLeave);
        }
      };

      return cleanup;
    };

    img.addEventListener('load', handleLoad);

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(animationFrameId);
      img.removeEventListener('load', handleLoad);
    };
  }, [src, baseIntensity, hoverIntensity, enableHover, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={`block ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        cursor: enableHover ? 'pointer' : 'default',
        display: 'block'
    }}
    />
  );
};

export default ImageAnimation;