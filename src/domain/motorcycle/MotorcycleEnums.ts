/**
 * High-level motorcycle body or usage category used for filtering, analytics,
 * maintenance defaults, and garage organization.
 */
export enum MotorcycleCategory {
  Scooter = 'Scooter',
  Underbone = 'Underbone',
  Naked = 'Naked',
  Sport = 'Sport',
  Adventure = 'Adventure',
  Cruiser = 'Cruiser',
  Touring = 'Touring',
  DirtBike = 'Dirt Bike',
  DualSport = 'Dual Sport',
  CafeRacer = 'Cafe Racer',
  Custom = 'Custom',
}

/**
 * Primary energy source for a motorcycle.
 */
export enum FuelType {
  Gasoline = 'Gasoline',
  Electric = 'Electric',
  Hybrid = 'Hybrid',
}

/**
 * Transmission type used by the motorcycle drivetrain.
 */
export enum TransmissionType {
  Manual = 'Manual',
  Automatic = 'Automatic',
  SemiAutomatic = 'Semi Automatic',
}
