import { StyleSheet, View } from 'react-native';
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
      anchor={{ x: 0.5, y: 0.5 }}>
      <View style={styles.pulse}><View style={styles.dot}/></View>
    </Marker>
  );
}

const styles=StyleSheet.create({pulse:{width:28,height:28,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:'rgba(249,115,22,.22)',borderWidth:1,borderColor:'rgba(249,115,22,.55)'},dot:{width:11,height:11,borderRadius:6,backgroundColor:'#F97316',borderWidth:2,borderColor:'#FFFFFF'}});
