import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('sensor_data')       // <-- replace with your table
      .select('*')
      .order('recorded_at', {ascending:false})
      .limit(500)         // <-- fields you want

    if (error) throw error

    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
