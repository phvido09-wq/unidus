import type { ComponentType } from 'react';
import { Dumbbell, ShoppingCart, Stethoscope, Store, type LucideProps } from 'lucide-react';
import type { AmenityType } from '../types';

export const AMENITY_META: Record<AmenityType, { label: string; color: string; Icon: ComponentType<LucideProps> }> = {
  gym: { label: 'Academias', color: '#7c3aed', Icon: Dumbbell },
  market: { label: 'Mercados', color: '#059669', Icon: ShoppingCart },
  convenience: { label: 'Conveniência', color: '#ea580c', Icon: Store },
  health: { label: 'Saúde', color: '#dc2626', Icon: Stethoscope },
};

export const AMENITY_ORDER: AmenityType[] = ['gym', 'market', 'convenience', 'health'];
