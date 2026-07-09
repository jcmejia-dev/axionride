import type { DashboardData } from '../types';

export const mockDashboardData: DashboardData = {
  motorcycle: {
    name: 'Skygo Boss 150',
    status: 'Ready to ride',
    displacement: '150cc',
    odometer: '12,430 km',
    lastUpdated: 'Last updated today',
  },
  maintenance: {
    task: 'Oil Change',
    remainingDistance: '320 km remaining',
    status: 'Due soon',
    progress: 0.78,
  },
  weather: {
    condition: 'Sunny',
    temperature: '29\u00B0C',
    rideCondition: 'Great for a short ride',
    wind: 'Light wind',
    rainChance: '10%',
  },
  monthlyStats: [
    {
      label: 'Ridden',
      value: '428 km',
      detail: 'This month',
      accent: 'orange',
    },
    {
      label: 'Rides',
      value: '12',
      detail: 'Logged trips',
      accent: 'cyan',
    },
    {
      label: 'Ride Time',
      value: '8h 35m',
      detail: 'Moving time',
      accent: 'success',
    },
    {
      label: 'Fuel Cost',
      value: '₱1,420',
      detail: 'Estimated',
      accent: 'warning',
    },
  ],
  recentRide: {
    when: 'Yesterday',
    distance: '42 km',
    duration: '1h 12m',
    averageSpeed: '35 km/h',
  },
  quickActions: [
    {
      label: 'Start Ride',
      icon: { ios: 'location.north.line.fill', android: 'near_me', web: 'near_me' },
    },
    {
      label: 'Add Maintenance',
      icon: { ios: 'wrench.adjustable.fill', android: 'build', web: 'build' },
    },
    {
      label: 'Add Motorcycle',
      icon: { ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' },
    },
  ],
};
