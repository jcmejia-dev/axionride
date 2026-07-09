export type CurrentRidePreview = {
  readonly distance: string;
  readonly time: string;
  readonly averageSpeed: string;
  readonly maxSpeed: string;
};

export type RideInsight = {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly accent: 'orange' | 'cyan' | 'success' | 'warning';
};

export type RecentRide = {
  readonly id: string;
  readonly title: string;
  readonly distance: string;
  readonly duration: string;
  readonly averageSpeed: string;
  readonly date: string;
};

export type RidesData = {
  readonly currentRide: CurrentRidePreview;
  readonly insights: readonly RideInsight[];
  readonly recentRides: readonly RecentRide[];
};
