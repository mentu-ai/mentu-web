import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PanoramaPage } from '@/components/panorama/panorama-page';

export default async function Panorama() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <PanoramaPage />;
}
