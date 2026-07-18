import { useEffect, useState } from 'react';

/**
 * The thin orange bar at the very top of quest pages: how far through the
 * quest you've read. Updated on a requestAnimationFrame so scrolling
 * stays smooth.
 */
export function ReadProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="read-progress" style={{ width: `${progress * 100}%` }} aria-hidden="true" />;
}
