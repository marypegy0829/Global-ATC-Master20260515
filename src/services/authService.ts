import { supabase } from './supabaseClient';
import { useRecordStore } from '../store/useRecordStore';

export const handleAutoOnboarding = async (user: any) => {
  if (!user) return;
  
  try {
    const { data: profile, error: selectError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', user.id)
      .maybeSingle();

    if (selectError) {
      console.error('Error fetching profile:', selectError);
      return;
    }

    // 提取全局系统的 user_metadata 值静默插入
    const metadata = user.user_metadata || {};
    const newProfile = {
      id: user.id,
      email: user.email,
      name: metadata.name || '',
      aircraft: metadata.aircraft || '',
      country: metadata.country || '',
      rank: metadata.rank || '',
    };

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert([newProfile], { onConflict: 'id' });

    if (upsertError) {
      console.error('Error auto-onboarding profile:', upsertError);
    }
  } catch (error) {
    console.error('Auto onboarding failed:', error);
  }
};

export const syncUserRecords = async (userId: string) => {
  if (!userId) return;
  try {
    // 1. Fetch cloud records
    const { data: cloudRecords, error } = await supabase
      .from('records')
      .select('id, title, is_favorite, result_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cloud records:', error);
      return;
    }

    const localState = useRecordStore.getState();
    const localRecords = localState.records;
    
    // 2. Discover local records not present in cloud based on ID matching or just keep cloud as source of truth.
    // For simplicity, we merge local missing ones into cloud
    const cloudRecordIds = new Set((cloudRecords || []).map(r => r.id));
    const newLocalRecords = localRecords.filter(r => !cloudRecordIds.has(r.id) && r.id.length === 36);

    if (newLocalRecords.length > 0) {
      const inserts = newLocalRecords.map(r => ({
        id: r.id,
        user_id: userId,
        title: r.title,
        is_favorite: r.isFavorite,
        result_data: r.result,
        created_at: new Date(r.date).toISOString()
      }));
      await supabase.from('records').insert(inserts);
    }
    
    // 3. fetch final again or just merge in memory
    const { data: finalCloudRecords } = await supabase
      .from('records')
      .select('id, title, is_favorite, result_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (finalCloudRecords) {
      const merged = finalCloudRecords.map((row: any) => ({
        id: row.id,
        title: row.title || 'Analysis Report',
        date: new Date(row.created_at).getTime(),
        isFavorite: row.is_favorite || false,
        result: row.result_data
      }));
      localState.setRecords(merged);
    }
  } catch (error) {
    console.error('Error syncing records:', error);
  }
};

