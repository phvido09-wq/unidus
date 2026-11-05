export type LatLng = [number, number];

export type CityName = 'São Paulo' | 'Santo André' | 'Campinas' | 'Bauru' | 'São Carlos';

export interface Campus {
  id: string;
  label: string;
  university: string;
  city: CityName;
  coords: LatLng;
}

export type AmenityType = 'gym' | 'market' | 'convenience' | 'health';

export interface Amenity {
  type: AmenityType;
  name: string;
  coords: LatLng;
  distanceKm: number;
  osmUrl?: string;
}

export type PropertyTag = 'Quarto individual' | 'Quarto em república' | 'Apartamento' | 'Kitnet / Studio';

export interface HouseRoutine {
  residents: number;
  gender: 'mista' | 'feminina' | 'masculina';
  vibe: 'tranquila' | 'equilibrada' | 'agitada';
  quietHours: string;
  examWeekSilence: boolean;
  parties: 'nunca' | 'as-vezes' | 'frequentes';
  visits: 'livres' | 'avisar' | 'sem-pernoite';
  cleaning: 'escala' | 'diarista' | 'cada-um';
  bills: 'igual' | 'por-quarto' | 'inclusas';
  smoking: 'nao' | 'area-externa' | 'sim';
  pets: boolean;
  notes: string;
}

export interface Property {
  id: string;
  source: 'demo' | 'live';
  ownerId?: string;
  campusId: string;
  tag: PropertyTag;
  title: string;
  type: string;
  neighborhood: string;
  description: string;
  features: string[];
  coords: LatLng;
  distanceKm: number;
  price: number;
  estimatedBills: number;
  image: string;
  media?: { kind: 'photo' | 'video'; url: string }[];
  storedAmenities?: Amenity[];
  houseRoutine?: HouseRoutine;
}
