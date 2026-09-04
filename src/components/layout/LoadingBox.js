import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';

function GradientCircularProgress({ size = 100 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={0} height={0}>
        <defs>
          <linearGradient id="my_gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#615d52ff" />
            <stop offset="50%" stopColor="#857d7eff" />
            <stop offset="100%" stopColor="#ceccccff" />
          </linearGradient>
        </defs>
      </svg>
      <CircularProgress
        size={size}
        thickness={4}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          'svg circle': { stroke: 'url(#my_gradient)' },
        }}
      />
      <img
        src="/images/logo.png"
        alt="lariran"
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size / 2,
          height: size / 2,
          objectFit: 'contain',
        }}
      />
    </div>
  );
}

export default function LoadingBox() {
  return (
    <div className="loadingdiv fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen flex items-center justify-center z-[999999999] bg-white">
      <div className="loadingdivinside flex items-center justify-center m-auto">
        <GradientCircularProgress size={150} />
      </div>
    </div>
  );
}