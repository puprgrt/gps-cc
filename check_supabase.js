require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking Supabase tables...");
  const { data, error } = await supabase.from('wa_conversations').select('*');
  if (error) console.error("Error fetching conversations:", error);
  else console.log(`wa_conversations count: ${data.length}`);
  
  if (data && data.length > 0) {
    console.log("First row:", data[0]);
  }
}

check();
