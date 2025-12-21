import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Allow requests from your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // preflight request
  }

  try {
    const { data, error } = await supabase
      .from('sensor_data')
      .select('*', 'row_number() over (order by recorded_at desc) as rn')
      .order('recorded_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    const sampled = data.filter((row) => row.rn % 60 === 0);
    res.status(200).json(sampled);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
