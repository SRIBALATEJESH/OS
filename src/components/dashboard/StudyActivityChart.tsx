'use client';

import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';

const WEEKLY_DATA = [
  { day: 'Mon', minutes: 45 },
  { day: 'Tue', minutes: 60 },
  { day: 'Wed', minutes: 95 },
  { day: 'Thu', minutes: 75 },
  { day: 'Fri', minutes: 120 },
  { day: 'Sat', minutes: 85 },
  { day: 'Sun', minutes: 50 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const mins = payload[0].value;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    return (
      <div className="bg-white/95 backdrop-blur-md border border-[#E5E3DC] rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-[#171717]">{label}</p>
        <p className="text-[#1F6B4F] font-medium">
          {hours > 0 ? `${hours}h ${remainingMins}m` : `${mins} minutes`}
        </p>
      </div>
    );
  }
  return null;
};

export const StudyActivityChart: React.FC = () => {
  return (
    <div className="w-full h-48 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={WEEKLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="day" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B6B65', fontSize: 11, fontWeight: 500 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B6B65', fontSize: 10 }} 
            unit="m" 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(31, 107, 79, 0.06)' }} />
          <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
            {WEEKLY_DATA.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.day === 'Fri' ? '#1F6B4F' : 'rgba(31, 107, 79, 0.65)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
