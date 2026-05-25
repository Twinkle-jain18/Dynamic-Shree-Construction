import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function BackButton({ onClick, label = '← Back', className = '' }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-3 left-3 z-50 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-body font-bold text-sm shadow-lg hover:bg-black hover:scale-105 transition-all duration-300 animate-fade-in ${className}`}
    >
      {label}
    </button>
  );
}
