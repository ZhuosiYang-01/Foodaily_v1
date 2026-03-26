import { supabase } from './supabase';
import { AppData, Category, Work, RecordEntry } from '../types';

const isBase64 = (s: string): boolean =>
  typeof s === 'string' && s.startsWith('data:image');

// Upload a base64 image to Supabase Storage, return public URL
async function uploadImage(base64: string, userId: string, folder: string): Promise<string> {
  if (!isBase64(base64)) return base64;
  try {
    const mimeMatch = base64.match(/data:([^;]+);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const ext = mime.split('/')[1] || 'jpg';
    const filename = `${userId}/${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;

    const fetchRes = await fetch(base64);
    const blob = await fetchRes.blob();

    const { error } = await supabase.storage
      .from('foodaily-images')
      .upload(filename, blob, { contentType: mime, upsert: false });

    if (error) {
      console.error('Image upload error:', error);
      return base64;
    }

    const { data } = supabase.storage.from('foodaily-images').getPublicUrl(filename);
    return data.publicUrl;
  } catch (e) {
    console.error('Image upload failed:', e);
    return base64;
  }
}

// Fetch all user data from Supabase
export async function fetchDataFromSupabase(userId: string): Promise<AppData | null> {
  try {
    const [catRes, worksRes, recordsRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', userId).order('order'),
      supabase.from('works').select('*').eq('user_id', userId),
      supabase.from('records').select('*').eq('user_id', userId),
    ]);

    if (catRes.error || worksRes.error || recordsRes.error) {
      console.error('Fetch error:', catRes.error || worksRes.error || recordsRes.error);
      return null;
    }

    const categories: Category[] = catRes.data.map((c: any) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      supportsTaste: (c as any).supports_taste ?? false,
      order: c.order,
    }));

    const works: Work[] = worksRes.data.map((w: any) => ({
      id: w.id,
      categoryId: w.category_id,
      name: w.name,
      coverImage: w.cover_image || '',
      originalCoverImage: w.original_cover_image || undefined,
      isEmojiCover: w.is_emoji_cover ?? false,
      isManualCover: w.is_manual_cover ?? false,
      createdAt: new Date(w.created_at).getTime(),
      updatedAt: new Date(w.updated_at).getTime(),
    }));

    const records: RecordEntry[] = recordsRes.data.map((r: any) => ({
      id: r.id,
      workId: r.work_id,
      date: r.date,
      title: r.title,
      taste: (r as any).taste || undefined,
      evaluation: r.evaluation || '',
      notes: r.notes || '',
      mainImage: r.main_image || '',
      originalMainImage: r.original_main_image || undefined,
      isEmojiMain: r.is_emoji_main ?? false,
      extraImages: r.extra_images || [],
      createdAt: new Date(r.created_at).getTime(),
    }));

    return { categories, works, records };
  } catch (e) {
    console.error('fetchDataFromSupabase failed:', e);
    return null;
  }
}

// Full sync: upsert local data to Supabase, delete remote items no longer in local data.
// Returns updated local data (base64 images replaced with Storage URLs).
export async function syncDataToSupabase(userId: string, data: AppData): Promise<AppData> {
  // --- Upload images ---
  const updatedWorks = await Promise.all(data.works.map(async (w) => {
    if (w.isEmojiCover) return w;
    const coverImage = await uploadImage(w.coverImage, userId, 'covers');
    const originalCoverImage = w.originalCoverImage
      ? await uploadImage(w.originalCoverImage, userId, 'covers')
      : w.originalCoverImage;
    return { ...w, coverImage, originalCoverImage };
  }));

  const updatedRecords = await Promise.all(data.records.map(async (r) => {
    if (r.isEmojiMain) return r;
    const mainImage = await uploadImage(r.mainImage, userId, 'records');
    const originalMainImage = r.originalMainImage
      ? await uploadImage(r.originalMainImage, userId, 'records')
      : r.originalMainImage;
    const extraImages = await Promise.all(
      r.extraImages.map(img => uploadImage(img, userId, 'records'))
    );
    return { ...r, mainImage, originalMainImage, extraImages };
  }));

  // --- Build DB rows ---
  // Never store raw base64 in the database — rows where the primary image
  // still failed to upload are skipped entirely and will be retried next sync.
  const categoryRows = data.categories.map(c => ({
    id: c.id,
    user_id: userId,
    name: c.name,
    icon: c.icon,
    order: c.order,
  }));

  const workRows = updatedWorks
    .filter(w => w.isEmojiCover || !isBase64(w.coverImage))
    .map(w => ({
      id: w.id,
      user_id: userId,
      category_id: w.categoryId,
      name: w.name,
      cover_image: w.coverImage,
      // Drop original if upload failed — never store base64 in DB
      original_cover_image: isBase64(w.originalCoverImage ?? '') ? null : (w.originalCoverImage ?? null),
      is_emoji_cover: w.isEmojiCover,
      is_manual_cover: w.isManualCover ?? false,
      created_at: new Date(w.createdAt).toISOString(),
      updated_at: new Date(w.updatedAt).toISOString(),
    }));

  const recordRows = updatedRecords
    .filter(r => r.isEmojiMain || !isBase64(r.mainImage))
    .map(r => ({
      id: r.id,
      user_id: userId,
      work_id: r.workId,
      title: r.title,
      date: r.date,
      // taste column not in DB schema — omitted
      evaluation: r.evaluation ?? null,
      notes: r.notes ?? null,
      main_image: r.mainImage,
      // Drop original if upload failed — never store base64 in DB
      original_main_image: isBase64(r.originalMainImage ?? '') ? null : (r.originalMainImage ?? null),
      is_emoji_main: r.isEmojiMain,
      // Drop any extra images that failed to upload
      extra_images: r.extraImages.filter(img => !isBase64(img)),
      created_at: new Date(r.createdAt).toISOString(),
      updated_at: new Date(r.createdAt).toISOString(),
    }));

  // --- Upsert ---
  const [catErr, worksErr, recordsErr] = await Promise.all([
    supabase.from('categories').upsert(categoryRows, { onConflict: 'id' }).then(r => r.error),
    workRows.length > 0
      ? supabase.from('works').upsert(workRows, { onConflict: 'id' }).then(r => r.error)
      : Promise.resolve(null),
    recordRows.length > 0
      ? supabase.from('records').upsert(recordRows, { onConflict: 'id' }).then(r => r.error)
      : Promise.resolve(null),
  ]);
  if (catErr) { console.error('Category upsert error:', catErr); throw new Error(`Category sync failed: ${catErr.message}`); }
  if (worksErr) { console.error('Works upsert error:', worksErr); throw new Error(`Works sync failed: ${worksErr.message}`); }
  if (recordsErr) { console.error('Records upsert error:', recordsErr); throw new Error(`Records sync failed: ${recordsErr.message}`); }

  // --- Reconcile deletions ---
  const [remoteCats, remoteWorks, remoteRecords] = await Promise.all([
    supabase.from('categories').select('id').eq('user_id', userId).then(r => r.data ?? []),
    supabase.from('works').select('id').eq('user_id', userId).then(r => r.data ?? []),
    supabase.from('records').select('id').eq('user_id', userId).then(r => r.data ?? []),
  ]);

  const localCatIds = new Set(data.categories.map(c => c.id));
  const localWorkIds = new Set(data.works.map(w => w.id));
  const localRecordIds = new Set(data.records.map(r => r.id));

  const toDeleteCats = (remoteCats as any[]).filter(c => !localCatIds.has(c.id)).map(c => c.id);
  const toDeleteWorks = (remoteWorks as any[]).filter(w => !localWorkIds.has(w.id)).map(w => w.id);
  const toDeleteRecords = (remoteRecords as any[]).filter(r => !localRecordIds.has(r.id)).map(r => r.id);

  await Promise.all([
    toDeleteCats.length > 0 ? supabase.from('categories').delete().in('id', toDeleteCats) : Promise.resolve(),
    toDeleteWorks.length > 0 ? supabase.from('works').delete().in('id', toDeleteWorks) : Promise.resolve(),
    toDeleteRecords.length > 0 ? supabase.from('records').delete().in('id', toDeleteRecords) : Promise.resolve(),
  ]);

  return { ...data, works: updatedWorks, records: updatedRecords };
}
