export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type MappableBusiness = {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
};

export type BusinessMapProps = {
  businesses: MappableBusiness[];
  center: Coordinate;
  userLocation: Coordinate | null;
  onSelectBusiness: (business: MappableBusiness) => void;
};
