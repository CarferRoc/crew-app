import { supabase } from './supabase';
import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export const uploadImage = async (uri: string, bucket: string, path: string) => {
    try {
        const file = new File(uri);
        const base64 = await file.base64();

        const filePath = `${path}/${Date.now()}.png`;
        const contentType = 'image/png';

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, decode(base64), { contentType });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};
