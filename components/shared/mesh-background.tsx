"use client";

import * as React from "react";

type Dot = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

const DOT_COUNT = 55;
const CONNECTION_DISTANCE = 140;
const DOT_SPEED = 0.35;

export function MeshBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const dotsRef = React.useRef<Dot[]>([]);
  const rafRef = React.useRef<number>(0);
  const mouseRef = React.useRef({ x: -9999, y: -9999 });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Init dots
    dotsRef.current = Array.from({ length: DOT_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * DOT_SPEED * 2,
      vy: (Math.random() - 0.5) * DOT_SPEED * 2,
      radius: Math.random() * 1.5 + 0.8,
    }));

    function getColors() {
      const isDark = document.documentElement.classList.contains("dark");
      return {
        dot: isDark ? "rgba(139,120,255,0.55)" : "rgba(99,80,210,0.35)",
        line: isDark ? "rgba(139,120,255," : "rgba(99,80,210,",
        mouseDot: isDark ? "rgba(200,180,255,0.8)" : "rgba(80,60,190,0.6)",
        mouseLine: isDark ? "rgba(200,180,255," : "rgba(80,60,190,",
      };
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const dots = dotsRef.current;
      const mouse = mouseRef.current;
      const colors = getColors();

      // Update positions
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
      }

      // Draw connections
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DISTANCE) {
            const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.45;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `${colors.line}${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Mouse connections
        const mdx = dots[i].x - mouse.x;
        const mdy = dots[i].y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < CONNECTION_DISTANCE * 1.6) {
          const alpha = (1 - mdist / (CONNECTION_DISTANCE * 1.6)) * 0.7;
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `${colors.mouseLine}${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw dots
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.dot;
        ctx.fill();
      }

      // Mouse dot
      if (mouse.x > -100) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = colors.mouseDot;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-20 h-full w-full"
      aria-hidden="true"
    />
  );
}
