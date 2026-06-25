import React from 'react';
import { Card } from '@/components/ui/card';

export default function StatsCard({ title, value, icon: Icon, trend, color }) {
  return (
    <Card className="relative overflow-hidden p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-heading font-bold mt-2 text-foreground">{value}</p>
          {trend && (
            <p className="text-xs mt-2 text-muted-foreground">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color || 'bg-primary/10'}`}>
          <Icon className={`w-6 h-6 ${color ? 'text-white' : 'text-primary'}`} />
        </div>
      </div>
    </Card>
  );
}