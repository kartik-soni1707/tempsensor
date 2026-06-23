import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { page } = req.body || {};
  if (!page) return res.status(400).json({ message: 'Missing page field' });

  // Get visitor IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;

  let region = null;
  try {
    if (ip) {
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
        const geoData = await geoRes.json();
        region = geoData.region || geoData.country_name || null;
    }
  } catch (err) {
    console.warn('Geo lookup failed', err);
  }

  try {
    const { data: existing } = await supabase
      .from('page_hits')
      .select('id')
      .eq('ip_address', ip)
      .limit(1);

    const isNewVisitor = !existing || existing.length === 0;

    const { error } = await supabase.from('page_hits').insert([
      {
        page,
        ip_address: ip,
        region,
        user_agent: req.headers['user-agent'] || null,
        referrer: req.headers.referer || null
      }
    ]);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: 'Database error' });
    }

    if (isNewVisitor && ip) {
      mailer.sendMail({
        from: `"Site Tracker" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO,
        subject: `New visitor on ${page}`,
        text: `IP: ${ip}\nRegion: ${region || 'unknown'}\nPage: ${page}\nUser-Agent: ${req.headers['user-agent'] || 'unknown'}\nReferrer: ${req.headers.referer || 'none'}`,
      }).catch(err => console.error('Email failed:', err));
    }

    return res.status(200).json({ message: 'Hit recorded' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}
