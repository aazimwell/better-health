import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

const signedCache = new Map<string, { url: string; exp: number }>();

/** Private profile photos are read through short-lived signed URLs. */
export async function signedAvatarUrl(path: string): Promise<string | null> {
  const hit = signedCache.get(path);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from('profile-photos').createSignedUrl(path, 3600);
  if (error || !data) return null;
  signedCache.set(path, { url: data.signedUrl, exp: Date.now() + 50 * 60 * 1000 });
  return data.signedUrl;
}

/** Opens the gallery and returns a compressed local JPEG uri (or null if cancelled). */
export async function pickCompressedImage(size = 720): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Photo permission is required to choose an image.');
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
  if (res.canceled || !res.assets?.[0]) return null;
  const out = await ImageManipulator.manipulateAsync(res.assets[0].uri, [{ resize: { width: size } }], {
    compress: 0.7, format: ImageManipulator.SaveFormat.JPEG,
  });
  return out.uri;
}

export async function uploadImage(bucket: string, path: string, uri: string): Promise<void> {
  const resp = await fetch(uri);
  const buf = await resp.arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, buf, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
}

export function publicUrl(bucket: string, path: string): string {
  return `${supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl}?t=${Date.now()}`;
}

/** Patient/own avatar: uploads to profile-photos/<uid>/avatar.jpg and stores the path on the profile. */
export async function uploadMyAvatar(userId: string, uri: string): Promise<string> {
  const path = `${userId}/avatar.jpg`;
  await uploadImage('profile-photos', path, uri);
  const { error } = await supabase.from('profiles').update({ avatar_url: path }).eq('id', userId);
  if (error) throw error;
  signedCache.delete(path);
  return path;
}
