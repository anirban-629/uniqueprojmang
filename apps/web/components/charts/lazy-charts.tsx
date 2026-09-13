'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const BURNDOWN_DATA = [
  { day: 'Day 1', ideal: 68, actual: 68 },
  { day: 'Day 3', ideal: 58, actual: 62 },
  { day: 'Day 5', ideal: 48, actual: 51 },
  { day: 'Day 7', ideal: 38, actual: 44 },
  { day: 'Day 9', ideal: 28, actual: 33 },
  { day: 'Day 11', ideal: 18, actual: 22 },
  { day: 'Day 13', ideal: 8, actual: 12 },
  { day: 'Day 14', ideal: 0, actual: 4 }
];

const VELOCITY_DATA = [
  { sprint: 'Sprint 37', committed: 55, completed: 52 },
  { sprint: 'Sprint 38', committed: 60, completed: 58 },
  { sprint: 'Sprint 39', committed: 65, completed: 61 },
  { sprint: 'Sprint 40', committed: 62, completed: 64 },
  { sprint: 'Sprint 41', committed: 68, completed: 42 }
];

const CFD_DATA = [
  { day: 'Mar 1', done: 0, inReview: 5, inProgress: 18, todo: 45 },
  { day: 'Mar 4', done: 12, inReview: 8, inProgress: 20, todo: 28 },
  { day: 'Mar 7', done: 24, inReview: 10, inProgress: 18, todo: 16 },
  { day: 'Mar 10', done: 36, inReview: 9, inProgress: 14, todo: 9 },
  { day: 'Mar 13', done: 42, inReview: 11, inProgress: 10, todo: 5 }
];

export function BurndownChart() {
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={BURNDOWN_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} unit=" pts" />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Line type="monotone" dataKey="ideal" name="Ideal Guideline" stroke="#64748b" strokeDasharray="5 5" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="actual" name="Actual Remaining" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VelocityChart() {
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={VELOCITY_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis dataKey="sprint" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} unit=" pts" />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="committed" name="Committed Points" fill="#334155" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" name="Completed Points" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CumulativeFlowChart() {
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={CFD_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Area type="monotone" dataKey="done" stackId="1" name="Done" fill="#10b981" stroke="#10b981" fillOpacity={0.6} />
          <Area type="monotone" dataKey="inReview" stackId="1" name="In Review" fill="#a855f7" stroke="#a855f7" fillOpacity={0.6} />
          <Area type="monotone" dataKey="inProgress" stackId="1" name="In Progress" fill="#f59e0b" stroke="#f59e0b" fillOpacity={0.6} />
          <Area type="monotone" dataKey="todo" stackId="1" name="To Do" fill="#6366f1" stroke="#6366f1" fillOpacity={0.6} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
