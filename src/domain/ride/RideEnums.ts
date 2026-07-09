/**
 * Lifecycle status for a ride record.
 */
export enum RideStatus {
  Draft = 'draft',
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

/**
 * User-facing ride category for filtering, insights, and future exports.
 */
export enum RideType {
  Commute = 'commute',
  City = 'city',
  Touring = 'touring',
  Mountain = 'mountain',
  Offroad = 'offroad',
  Race = 'race',
  Custom = 'custom',
}
