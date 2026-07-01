const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jkkkjqrdfqzllrxjukzl.supabase.co";
const supabaseAnonKey = "sb_publishable_TiRHrg6Er7qW0bUPFfymNw_leljKki6";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      console.log('Profiles in DB:', profiles.length);
      console.log('Sample profiles:', JSON.stringify(profiles, null, 2));
    }
  } catch (err) {
    console.error('Err:', err);
  }
}

test();
