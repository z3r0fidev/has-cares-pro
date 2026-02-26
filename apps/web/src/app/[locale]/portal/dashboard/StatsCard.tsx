"use client";

import { Eye, MapPin, Globe, Video } from 'lucide-react';

interface StatsCardProps {
  stats: Record<string, number>;
}

export default function StatsCard({ stats }: StatsCardProps) {
  const items = [
    { label: 'Profile Views', key: 'profile_view', icon: Eye, color: 'text-blue-600' },
    { label: 'Map Clicks', key: 'direction_click', icon: MapPin, color: 'text-green-600' },
    { label: 'Website Visits', key: 'website_url_click', icon: Globe, color: 'text-purple-600' },
    { label: 'Telehealth Clicks', key: 'telehealth_url_click', icon: Video, color: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => (
        <div key={item.key} className="p-4 border rounded-lg bg-slate-50">
          <div className="flex items-center gap-2 mb-2">
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <span className="text-sm font-medium text-slate-600">{item.label}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats[item.key] || 0}</p>
        </div>
      ))}
    </div>
  );
}
