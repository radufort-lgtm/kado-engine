import { createClient } from 'https://esm.sh/@supabase/supabase-client@2.39.0';

// 1. Get your keys from the Environment Variables we set in Google Cloud
const SUPABASE_URL = Deno.env.get('https://hpgionzkpvplaeczhxza.supabase.co') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZ2lvbnprcHZwbGFlY3poeHphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE5MjA2OCwiZXhwIjoyMDgyNzY4MDY4fQ.vkoJVm3fh-fez66zazBEtD4ioEaS_0k4RgVRTjzddZs') || '';
const YT_API_KEY = Deno.env.get('AIzaSyC_6GZQU4gNYpwk42eHHAL_5CPCavWqvjQ') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 2. The list of Apple Music genres to scout
const GENRES = ["Phonk", "Lofi", "Hardstyle", "Ambient", "Drum and Bass"];

async function findCleanMetadata(genre: string) {
  console.log(`🔍 Scout searching for official ${genre} hits...`);
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${genre}+official+audio&type=video&videoCategoryId=10&maxResults=20&key=${YT_API_KEY}`
  );
  const data = await response.json();
  return data.items || [];
}

async function syncToKado() {
  let totalAdded = 0;
  for (const genre of GENRES) {
    const tracks = await findCleanMetadata(genre);
    for (const track of tracks) {
      const { error } = await supabase
        .from('alpha_tracks')
        .upsert({
          title: track.snippet.title,
          artist: track.snippet.channelTitle.replace(' - Topic', ''),
          genre: genre,
          cover_url: track.snippet.thumbnails.high.url,
          youtube_id: track.id.videoId,
          created_at: new Date().toISOString()
        }, { onConflict: 'youtube_id' });

      if (!error) totalAdded++;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return totalAdded;
}

// 3. FIX: Dynamic Port Handling for Google Cloud Run
// Google Cloud Run requires the server to listen on port 8080 by default.
const port = Number(Deno.env.get("PORT") || 8080);

Deno.serve({ port, hostname: "0.0.0.0" }, async (req) => {
  try {
    const count = await syncToKado();
    return new Response(JSON.stringify({ status: "success", count }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: "error", message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
