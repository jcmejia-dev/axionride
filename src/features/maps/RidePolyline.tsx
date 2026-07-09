import { Polyline, type LatLng } from 'react-native-maps';

import type { RidePoint } from '@/src/domain/ride';
import { palette } from '@/src/theme';

type RidePolylineProps = {
  readonly points: readonly RidePoint[];
};

export function RidePolyline({ points }: RidePolylineProps) {
  const coordinates = points.map(toLatLng);

  if (coordinates.length < 2) {
    return null;
  }

  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={palette.accentOrange}
      strokeWidth={5}
      lineCap="round"
      lineJoin="round"
    />
  );
}

function toLatLng(point: RidePoint): LatLng {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
  };
}
