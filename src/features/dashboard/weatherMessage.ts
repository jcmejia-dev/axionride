import type { WeatherCondition } from './types';

export function getWeatherRideMessage(condition: WeatherCondition) {
  switch (condition) {
    case 'Sunny':
      return 'Clear skies. Looks like a good time for a ride.';
    case 'Rainy':
      return 'Roads may be slippery. Ride carefully today.';
    case 'Windy':
      return 'Strong crosswinds possible. Keep inputs smooth and leave extra room.';
    case 'Cloudy':
      return 'Cooler weather. Great for a relaxed cruise.';
    case 'Stormy':
      return 'Better to avoid riding until conditions improve.';
    case 'Hot':
      return 'Hydrate before riding. Short rides are safer today.';
  }
}
