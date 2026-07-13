import type { NearbyCoordinate, NearbyPlace, NearbyServiceCategory } from './NearbyServiceTypes';
import { getNearbyCategory } from './NearbyServiceCategories';

export function createGoogleMapsDirectionsUrl(place: NearbyPlace) {
  const destination = `${place.location.latitude},${place.location.longitude}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&destination_place_id=${encodeURIComponent(place.id)}&travelmode=driving`;
}

export function createGoogleMapsPlaceUrl(place: NearbyPlace) {
  return place.googleMapsUri
    ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address}`)}&query_place_id=${encodeURIComponent(place.id)}`;
}

export function createGoogleMapsFallbackSearchUrl(category: NearbyServiceCategory, location?: NearbyCoordinate) {
  const query = getNearbyCategory(category).textQuery ?? getNearbyCategory(category).label;
  const locationHint = location ? ` near ${location.latitude},${location.longitude}` : '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + locationHint)}`;
}
