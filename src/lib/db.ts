import { supabase } from './supabase';
import { distanceToCampus } from '../data/properties';
import type { Amenity, HouseRoutine, Property, PropertyTag } from '../types';
import { parseRoutine } from '../data/houseRoutine';
import type { PreparedMedia } from './media';
import { StageError } from './errors';

const randomId = () => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

export const LEGAL_VERSION = '2026-11-04';

const client = () => {
  if (!supabase) throw new Error('O Supabase não está configurado.');
  return supabase;
};

const fail = (error: { message: string; code?: string; details?: string | null; hint?: string | null } | null) => {
  if (!error) return;
  const extra = [error.code, error.details, error.hint].filter(Boolean).join(' · ');
  throw new Error(extra ? `${error.message} (${extra})` : error.message);
};

export interface Profile {
  id: string;
  full_name: string;
  is_adult: boolean;
  terms_version: string;
  accepted_at: string;
  created_at: string;
}

export const getMyProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await client().from('profiles').select('*').eq('id', userId).maybeSingle();
  fail(error);
  return data as Profile | null;
};

export const createProfile = async (userId: string, fullName: string) => {
  const { error } = await client().from('profiles').insert({
    id: userId,
    full_name: fullName.trim(),
    is_adult: true,
    terms_version: LEGAL_VERSION,
  });
  fail(error);
};

export const updateProfileName = async (userId: string, fullName: string) => {
  const { error } = await client().from('profiles').update({ full_name: fullName.trim() }).eq('id', userId);
  fail(error);
};

export type ListingStatus = 'pending' | 'published' | 'rejected';

export interface ListingRow {
  id: string;
  owner_id: string;
  status: ListingStatus;
  tag: PropertyTag;
  title: string;
  room_type: string;
  campus_id: string;
  neighborhood: string;
  description: string;
  features: string[];
  price: number;
  estimated_bills: number;
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  house_routine?: unknown;
  created_at: string;
}

export type NewListing = Pick<
  ListingRow,
  'tag' | 'title' | 'room_type' | 'campus_id' | 'neighborhood' | 'description' | 'features' | 'price' | 'estimated_bills'
> & { house_routine?: HouseRoutine | null };

export interface ListingAddress {
  cep: string;
  street: string;
  number: string;
  complement: string;
  city: string;
  state: string;
}

const MEDIA_BUCKET = 'listing-media';
const SIGNED_URL_TTL_S = 6 * 60 * 60;

interface MediaRow {
  path: string;
  kind: 'photo' | 'video';
  position: number;
}

const removeFiles = async (paths: string[]) => {
  if (paths.length === 0) return;
  const { error } = await client().storage.from(MEDIA_BUCKET).remove(paths);
  fail(error);
};

export const createListing = async (
  userId: string,
  listing: NewListing,
  address: ListingAddress,
  media: PreparedMedia[],
  onProgress?: (done: number, total: number) => void
) => {
  const { data: listingId, error } = await client().rpc('create_listing', { listing, address });
  if (error) throw new StageError('salvar o anúncio e o endereço', error);
  const id = listingId as string;

  const uploaded: string[] = [];
  try {
    for (const [i, m] of media.entries()) {
      const path = `${userId}/${id}/${String(i).padStart(2, '0')}-${randomId()}.${m.ext}`;
      const { error: upErr } = await client()
        .storage.from(MEDIA_BUCKET)
        .upload(path, m.blob, { contentType: m.contentType, upsert: false, cacheControl: '3600' });
      if (upErr) throw new StageError(`enviar ${m.kind === 'video' ? 'o vídeo' : `a foto ${i + 1}`}`, upErr);
      uploaded.push(path);
      onProgress?.(i + 1, media.length);
    }
    if (uploaded.length) {
      const { error: rowErr } = await client()
        .from('listing_media')
        .insert(media.map((m, i) => ({ listing_id: id, path: uploaded[i], kind: m.kind, position: i })));
      if (rowErr) throw new StageError('registrar as fotos no anúncio', rowErr);
    }
  } catch (err) {
    await removeFiles(uploaded).catch(() => undefined);
    await client().from('listings').delete().eq('id', id);
    throw err;
  }
};

export interface MyListingRow extends ListingRow {
  address: (ListingAddress & { complement: string | null }) | null;
  media: MediaRow[];
}

export const getMyListings = async (userId: string): Promise<MyListingRow[]> => {
  const { data, error } = await client()
    .from('listings')
    .select('*, address:listing_addresses(cep, street, number, complement, city, state), media:listing_media(path, kind, position)')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });
  fail(error);
  return (data ?? []) as MyListingRow[];
};

export const formatAddress = (a: MyListingRow['address']) =>
  a
    ? `${a.street}, ${a.number}${a.complement ? ` (${a.complement})` : ''} · ${a.city}/${a.state} · CEP ${a.cep.replace(
        /^(\d{5})(\d{3})$/,
        '$1-$2'
      )}`
    : null;

export const deleteListing = async (row: Pick<MyListingRow, 'id' | 'media'>) => {
  await removeFiles(row.media.map((m) => m.path));
  const { error } = await client().from('listings').delete().eq('id', row.id);
  fail(error);
};

type PoisEmbed = { amenities: Amenity[] } | { amenities: Amenity[] }[] | null | undefined;

const poisFromEmbed = (embed: PoisEmbed): Amenity[] | undefined => {
  const row = Array.isArray(embed) ? embed[0] : embed;
  return row && Array.isArray(row.amenities) ? row.amenities : undefined;
};

export const saveListingPois = async (listingId: string, amenities: Amenity[]) => {
  const { error } = await client()
    .from('listing_pois')
    .upsert({ listing_id: listingId, amenities, fetched_at: new Date().toISOString() });
  fail(error);
};

export const amIAdmin = async (): Promise<boolean> => {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
};

const rowToProperty = (
  row: ListingRow & { media?: MediaRow[]; pois?: PoisEmbed },
  urls: Map<string, string>
): Property => {
  const coords: [number, number] = [row.lat ?? 0, row.lng ?? 0];
  const media = [...(row.media ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((m) => ({ kind: m.kind, url: urls.get(m.path) ?? '' }))
    .filter((m) => m.url);
  const cover = media.find((m) => m.kind === 'photo')?.url;
  return {
    id: row.id,
    source: 'live',
    ownerId: row.owner_id,
    campusId: row.campus_id,
    tag: row.tag,
    title: row.title,
    type: row.room_type,
    neighborhood: row.neighborhood,
    description: row.description,
    features: row.features,
    coords,
    distanceKm: distanceToCampus(coords, row.campus_id),
    price: row.price,
    estimatedBills: row.estimated_bills,
    image: cover ?? row.image_url ?? '',
    media,
    storedAmenities: poisFromEmbed(row.pois),
    houseRoutine: row.tag === 'Quarto em república' ? parseRoutine(row.house_routine) : undefined,
  };
};

export const getPublishedListings = async (): Promise<Property[]> => {
  if (!supabase) return [];
  const query = (columns: string) =>
    supabase!.from('listings').select(columns).eq('status', 'published').order('created_at', { ascending: false }).limit(100);
  let { data, error } = await query('*, media:listing_media(path, kind, position), pois:listing_pois(amenities)');
  if (error && /listing_pois/i.test(error.message)) {
    ({ data, error } = await query('*, media:listing_media(path, kind, position)'));
  }
  fail(error);
  const rows = ((data ?? []) as unknown as (ListingRow & { media: MediaRow[]; pois?: PoisEmbed })[]).filter(
    (r) => r.lat !== null && r.lng !== null
  );

  const paths = rows.flatMap((r) => r.media.map((m) => m.path));
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_S);
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  return rows.map((r) => rowToProperty(r, urls));
};

export interface MessageRow {
  id: string;
  listing_id: string;
  sender_id: string;
  recipient_id: string;
  sender_name: string;
  recipient_name: string;
  body: string;
  created_at: string;
  listing: { title: string } | null;
}

export const sendMessage = async (listingId: string, recipientId: string, body: string) => {
  const { error } = await client()
    .from('messages')
    .insert({ listing_id: listingId, recipient_id: recipientId, body: body.trim() });
  fail(error);
};

export const getMyMessages = async (): Promise<MessageRow[]> => {
  const { data, error } = await client()
    .from('messages')
    .select('*, listing:listings(title)')
    .order('created_at', { ascending: true })
    .limit(1000);
  fail(error);
  return (data ?? []) as MessageRow[];
};

export const exportMyData = async (userId: string, email: string | undefined) => {
  const [profile, listings, messages] = await Promise.all([getMyProfile(userId), getMyListings(userId), getMyMessages()]);
  return {
    exportado_em: new Date().toISOString(),
    conta: { id: userId, email },
    perfil: profile,
    anuncios: listings,
    mensagens: messages.map(({ listing, ...m }) => ({ ...m, anuncio: listing?.title ?? null })),
  };
};

export const deleteMyAccount = async (userId: string) => {
  const listings = await getMyListings(userId);
  await removeFiles(listings.flatMap((l) => l.media.map((m) => m.path)));
  const { error } = await client().rpc('delete_my_account');
  fail(error);
};
