import React, { useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2900);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="splash-container">
      <div className="splash-grid-bg" />
      
      <div className="splash-content">
        <div className="splash-logo">
          <span className="logo-text">CONVERSIO</span>
          <span className="logo-dot">.</span>
        </div>
        <p className="splash-subtitle">Anúncios em Segundos</p>
      </div>

      <div className="splash-progress-bar">
        <div className="splash-progress-fill" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes logoEntrance {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes subtitleFade {
          from { transform: translateY(10); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.3); }
        }
        @keyframes splashExit {
          from { opacity: 1; }
          to   { opacity: 0; }
        }

        .splash-container {
          position: fixed; 
          inset: 0;
          background: #0A0A0A;
          display: flex; 
          flex-direction: column;
          align-items: center; 
          justify-content: center;
          z-index: 9999;
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          animation: splashExit 300ms 2600ms ease forwards;
        }

        .splash-grid-bg {
          position: absolute; 
          inset: 0;
          background-image: 
            linear-gradient(#ffffff08 1px, transparent 1px),
            linear-gradient(90deg, #ffffff08 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .splash-content { 
          position: relative; 
          text-align: center; 
          z-index: 1;
        }

        .logo-text {
          font-size: clamp(48px, 15vw, 72px);
          font-weight: 900;
          color: #F5A623;
          letter-spacing: -0.02em;
          line-height: 1;
          display: inline-block;
          animation: logoEntrance 600ms 100ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .logo-dot {
          font-size: clamp(48px, 15vw, 72px);
          font-weight: 900;
          color: #F5A623;
          display: inline-block;
          animation: 
            logoEntrance 600ms 100ms cubic-bezier(0.34, 1.56, 0.64, 1) both,
            dotPulse 600ms 1200ms ease-in-out 2;
        }

        .splash-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          margin-top: 12px;
          animation: subtitleFade 400ms 400ms ease both;
        }

        .splash-progress-bar {
          position: absolute; 
          bottom: 0; 
          left: 0; 
          right: 0;
          height: 3px; 
          background: #ffffff10;
        }

        .splash-progress-fill {
          height: 100%; 
          background: #F5A623;
          animation: progressFill 1800ms 600ms linear both;
          box-shadow: 0 0 8px #F5A623;
        }
      `}} />
    </div>
  );
}
