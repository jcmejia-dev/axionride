import type { MaintenanceData } from '../types';

export const mockMaintenance: MaintenanceData = {
  overallStatus: {
    status: 'Due Soon',
    nextService: 'Oil Change',
    remainingDistance: '320 km remaining',
    progress: 0.78,
  },
  summary: [
    {
      label: 'Upcoming',
      value: '3',
      detail: 'Next 30 days',
      accent: 'orange',
    },
    {
      label: 'Overdue',
      value: '1',
      detail: 'Needs attention',
      accent: 'danger',
    },
    {
      label: 'Completed',
      value: '8',
      detail: 'Logged services',
      accent: 'success',
    },
    {
      label: 'Total Cost',
      value: '₱2,850',
      detail: 'Demo spend',
      accent: 'warning',
    },
  ],
  upcomingTasks: [
    {
      id: 'task-oil-change',
      title: 'Oil Change',
      remainingDistance: '320 km remaining',
      status: 'Due Soon',
    },
    {
      id: 'task-chain-adjustment',
      title: 'Chain Adjustment',
      remainingDistance: '700 km remaining',
      status: 'Good',
    },
    {
      id: 'task-brake-inspection',
      title: 'Brake Inspection',
      remainingDistance: '1,200 km remaining',
      status: 'Good',
    },
  ],
  timeline: [
    {
      id: 'history-oil',
      title: 'Changed oil',
      description: 'Engine oil and filter refreshed.',
      completedAt: 'Yesterday',
    },
    {
      id: 'history-chain',
      title: 'Cleaned chain',
      description: 'Chain cleaned, lubricated, and inspected.',
      completedAt: 'Last week',
    },
    {
      id: 'history-brakes',
      title: 'Replaced brake pads',
      description: 'Front pads replaced and brake feel checked.',
      completedAt: 'May 18',
    },
  ],
};
