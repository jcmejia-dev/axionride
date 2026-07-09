import type { RidesData } from '../types';

export const mockRides: RidesData = {
  currentRide: {
    distance: '0.0 km',
    time: '00:00',
    averageSpeed: '0 km/h',
    maxSpeed: '0 km/h',
  },
  insights: [
    {
      label: 'This Week',
      value: '128 km',
      detail: 'Distance ridden',
      accent: 'orange',
    },
    {
      label: 'Longest Ride',
      value: '72 km',
      detail: 'Mountain loop',
      accent: 'cyan',
    },
    {
      label: 'Top Speed',
      value: '92 km/h',
      detail: 'Demo max',
      accent: 'warning',
    },
    {
      label: 'Ride Time',
      value: '5h 42m',
      detail: 'Total this week',
      accent: 'success',
    },
  ],
  recentRides: [
    {
      id: 'ride-city-cruise',
      title: 'City cruise',
      distance: '18.4 km',
      duration: '38m',
      averageSpeed: '29 km/h',
      date: 'Yesterday',
    },
    {
      id: 'ride-work-commute',
      title: 'Work commute',
      distance: '12.7 km',
      duration: '24m',
      averageSpeed: '32 km/h',
      date: 'Monday',
    },
    {
      id: 'ride-mountain',
      title: 'Mountain ride',
      distance: '72.0 km',
      duration: '2h 18m',
      averageSpeed: '41 km/h',
      date: 'Last Sunday',
    },
  ],
};
