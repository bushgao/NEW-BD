import React, { useEffect, useRef } from 'react';

const HeroBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const blobs = [
            { x: width * 0.2, y: height * 0.3, r: 600, color: 'rgba(79, 70, 229, 0.12)', vx: 0.2, vy: 0.1 },
            { x: width * 0.8, y: height * 0.4, r: 700, color: 'rgba(168, 85, 247, 0.15)', vx: -0.1, vy: 0.2 },
            { x: width * 0.5, y: height * 0.8, r: 600, color: 'rgba(56, 189, 248, 0.12)', vx: 0.1, vy: -0.1 },
        ];

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            blobs.forEach(blob => {
                blob.x += blob.vx;
                blob.y += blob.vy;
                if (blob.x < -300 || blob.x > width + 300) blob.vx *= -1;
                if (blob.y < -300 || blob.y > height + 300) blob.vy *= -1;
                const g = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
                g.addColorStop(0, blob.color);
                g.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, width, height);
            });
            requestAnimationFrame(animate);
        };

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        const animationFrame = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrame);
        };
    }, []);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-white pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
            <canvas ref={canvasRef} className="absolute inset-0" />
        </div>
    );
};

export default HeroBackground;
