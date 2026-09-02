import React from 'react';
import { Teacher } from '../types';

interface TeacherAvatarProps {
  teacher?: Partial<Teacher> | null;
  name?: string;
  avatarUrl?: string | null;
  avatarColor?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const TeacherAvatar: React.FC<TeacherAvatarProps> = ({
  teacher,
  name,
  avatarUrl,
  avatarColor,
  size = 'md',
  className = '',
}) => {
  const actualName = teacher?.name || name || 'U';
  const actualUrl = teacher?.avatarUrl || avatarUrl;
  const actualColor = teacher?.avatarColor || avatarColor || 'bg-emerald-700';

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] rounded-md',
    sm: 'w-7 h-7 text-xs rounded-lg',
    md: 'w-8 h-8 text-xs rounded-lg',
    lg: 'w-10 h-10 text-sm rounded-xl',
    xl: 'w-14 h-14 text-lg rounded-2xl',
  };

  const initial = actualName ? actualName.trim()[0].toUpperCase() : 'U';

  if (actualUrl) {
    return (
      <img
        src={actualUrl}
        alt={actualName}
        className={`${sizeClasses[size]} object-cover shrink-0 shadow-xs border border-emerald-500/30 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${actualColor} text-white flex items-center justify-center font-bold shrink-0 shadow-xs border border-emerald-500/30 ${className}`}
    >
      {initial}
    </div>
  );
};
