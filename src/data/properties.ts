import type { Campus, Property } from '../types';
import { haversineKm } from '../lib/geo';

export const CAMPUSES: Campus[] = [
  { id: 'usp-butanta', label: 'USP Butantã', university: 'USP', city: 'São Paulo', coords: [-23.5614, -46.7216] },
  { id: 'unicamp-barao', label: 'UNICAMP Barão Geraldo', university: 'UNICAMP', city: 'Campinas', coords: [-22.817, -47.0695] },
  { id: 'unesp-bauru', label: 'UNESP Bauru', university: 'UNESP', city: 'Bauru', coords: [-22.3505, -49.0308] },
  { id: 'ufabc-sa', label: 'UFABC Santo André', university: 'UFABC', city: 'Santo André', coords: [-23.6439, -46.5283] },
  { id: 'ufscar-sc', label: 'UFSCar São Carlos', university: 'UFSCar', city: 'São Carlos', coords: [-21.984, -47.881] },
  { id: 'mackenzie', label: 'Mackenzie Higienópolis', university: 'Mackenzie', city: 'São Paulo', coords: [-23.5475, -46.6519] },
  { id: 'pucsp', label: 'PUC-SP Perdizes', university: 'PUC-SP', city: 'São Paulo', coords: [-23.5367, -46.672] },
];

export const campusById = (id: string) => CAMPUSES.find((c) => c.id === id);

const round1 = (n: number) => Math.round(n * 10) / 10;

export const distanceToCampus = (coords: [number, number], campusId: string) => {
  const campus = campusById(campusId);
  return campus ? round1(haversineKm(coords, campus.coords)) : 0;
};

const RAW_PROPERTIES: (Omit<Property, 'distanceKm' | 'id' | 'source' | 'ownerId'> & { id: number })[] = [
  {
    id: 1,
    campusId: 'usp-butanta',
    tag: 'Quarto em república',
    title: 'Casa para dividir histórias',
    type: 'Quarto compartilhado · 5 moradores',
    neighborhood: 'Butantã',
    description:
      'Casa térrea com quintal, a poucos minutos da Cidade Universitária. Ambiente animado, mas com regra de silêncio em semana de provas.',
    features: ['Mobiliado', 'Wi-Fi', 'Lavanderia', 'Quintal'],
    coords: [-23.57, -46.711],
    price: 880,
    estimatedBills: 0,
    image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1000&q=80',
    houseRoutine: {
      residents: 5,
      gender: 'mista',
      vibe: 'agitada',
      quietHours: '23h às 7h',
      examWeekSilence: true,
      parties: 'as-vezes',
      visits: 'livres',
      cleaning: 'escala',
      bills: 'inclusas',
      smoking: 'area-externa',
      pets: false,
      notes: 'Churrasco no quintal aos sábados. Mercado básico dividido no mês.',
    },
  },
  {
    id: 2,
    campusId: 'usp-butanta',
    tag: 'Quarto individual',
    title: 'Seu canto perto da Cidade Universitária',
    type: 'Quarto mobiliado · 3 moradores',
    neighborhood: 'Rio Pequeno',
    description:
      'Quarto individual em apartamento tranquilo, com linhas de ônibus que entram direto no campus. Ideal para quem quer foco.',
    features: ['Mobiliado', 'Wi-Fi', 'Portaria 24h', 'Mesa de estudos'],
    coords: [-23.5695, -46.747],
    price: 1150,
    estimatedBills: 150,
    image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 3,
    campusId: 'unicamp-barao',
    tag: 'Apartamento',
    title: 'Mais espaço, do seu jeito',
    type: '2 quartos · Para morar ou dividir',
    neighborhood: 'Barão Geraldo',
    description:
      'Apartamento de 2 quartos com varanda, no miolo de Barão Geraldo. Dá para ir de bike até a UNICAMP e voltar a pé à noite.',
    features: ['Varanda', 'Vaga de bike', 'Cozinha equipada', 'Aceita pets'],
    coords: [-22.829, -47.081],
    price: 1850,
    estimatedBills: 320,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 4,
    campusId: 'unesp-bauru',
    tag: 'Quarto individual',
    title: 'Uma pausa entre as aulas',
    type: 'Quarto mobiliado · 2 moradores',
    neighborhood: 'Vargem Limpa',
    description:
      'Quarto claro em casa com só mais um morador. Rua residencial, perto do campus e do comércio da Vargem Limpa.',
    features: ['Mobiliado', 'Wi-Fi', 'Garagem', 'Área de serviço'],
    coords: [-22.342, -49.023],
    price: 790,
    estimatedBills: 180,
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 5,
    campusId: 'ufabc-sa',
    tag: 'Kitnet / Studio',
    title: 'Pequeno, prático e só seu',
    type: 'Studio mobiliado · 1 morador',
    neighborhood: 'Vila Assunção',
    description: 'Studio compacto e bem resolvido, a uma caminhada da UFABC. Prédio com lavanderia coletiva e bicicletário.',
    features: ['Mobiliado', 'Wi-Fi', 'Lavanderia coletiva', 'Bicicletário'],
    coords: [-23.649, -46.5345],
    price: 1350,
    estimatedBills: 200,
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 6,
    campusId: 'ufscar-sc',
    tag: 'Quarto em república',
    title: 'República com quintal e rotina tranquila',
    type: 'Quarto individual · 6 moradores',
    neighborhood: 'Jardim Bandeirantes',
    description:
      'República tradicional com churrasqueira e horta. Moradores de cursos variados e divisão de tarefas organizada.',
    features: ['Contas inclusas', 'Churrasqueira', 'Horta', 'Wi-Fi'],
    coords: [-22.001, -47.896],
    price: 650,
    estimatedBills: 0,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80',
    houseRoutine: {
      residents: 6,
      gender: 'mista',
      vibe: 'tranquila',
      quietHours: '22h às 7h',
      examWeekSilence: true,
      parties: 'as-vezes',
      visits: 'avisar',
      cleaning: 'escala',
      bills: 'inclusas',
      smoking: 'nao',
      pets: false,
      notes: 'Escala semanal de tarefas, inclusive a horta. Reunião da casa uma vez por mês.',
    },
  },
  {
    id: 7,
    campusId: 'mackenzie',
    tag: 'Quarto individual',
    title: 'No centro de tudo, a pé da aula',
    type: 'Quarto em apê · 2 moradores',
    neighborhood: 'Higienópolis',
    description: 'Quarto em apartamento clássico de Higienópolis, perto do metrô e a poucos quarteirões do Mackenzie.',
    features: ['Mobiliado', 'Portaria 24h', 'Perto do metrô', 'Wi-Fi'],
    coords: [-23.544, -46.656],
    price: 1490,
    estimatedBills: 160,
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 8,
    campusId: 'pucsp',
    tag: 'Apartamento',
    title: 'Apê para formar a sua turma',
    type: '3 quartos · Ideal para dividir',
    neighborhood: 'Perdizes',
    description:
      'Apartamento amplo de 3 quartos, ótimo para dividir com colegas. Rua arborizada e muitas opções de comida por perto.',
    features: ['3 quartos', 'Sala ampla', 'Vaga de garagem', 'Aceita pets'],
    coords: [-23.533, -46.679],
    price: 1980,
    estimatedBills: 350,
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=80',
  },
];

export const PROPERTIES: Property[] = RAW_PROPERTIES.map((p) => ({
  ...p,
  id: String(p.id),
  source: 'demo' as const,
  distanceKm: distanceToCampus(p.coords, p.campusId),
}));
