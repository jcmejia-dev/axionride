import { Marker } from 'react-native-maps';

import type { RidePoint } from '@/src/domain/ride';

type CurrentLocationMarkerProps = {
  readonly point: RidePoint | null;
  readonly title?: string;
};

export function CurrentLocationMarker({ point, title = 'Current position' }: CurrentLocationMarkerProps) {
  if (!point) {
    return null;
  }

  return (
    <Marker
      coordinate={{
        latitude: point.latitude,
        longitude: point.longitude,
      }}
      title={title}
      pinColor="#22D3EE"
    />
  );
}
