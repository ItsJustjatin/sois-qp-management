/* ==========================================================================
   SOIS QP System — API Configuration
   Fill in your keys below after signing up for each service.
   ========================================================================== */

window.SOIS_CONFIG = {

    // ─── SUPABASE (Cloud Database) ────────────────────────────────────────────
    // Sign up free at: https://supabase.com
    // Get these from: Project Settings → API

    SUPABASE_URL: 'https://cwrdmarlmwmitwpmztdh.supabase.co',        // e.g. https://abcxyz.supabase.co
    SUPABASE_ANON: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cmRtYXJsbXdtaXR3cG16dGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODQ5MzQsImV4cCI6MjEwMjg2MDkzNH0.h_ytyR8vw-6Qcefn7W_t8ywSoDAUVSuqGHVSls7HKPcRE',   // long JWT starting with eyJ...

    // ─── EMAILJS (Email OTP) ──────────────────────────────────────────────────
    // Sign up free at: https://emailjs.com  (200 emai
    // ls/month free)
    // Template body must include: {{otp_code}} and {{to_name}}
    EMAILJS_SERVICE_ID: 'service_wbv376d',   // e.g. service_abc123
    EMAILJS_TEMPLATE_ID: 'template_p92sk9z',  // e.g. template_xyz789
    EMAILJS_PUBLIC_KEY: 'uzY3ybC81z3hBVlue',   // from Account → General

    // ─── SMS OTP (via Netlify Function + Twilio) ──────────────────────────────
    // Sign up free at: https://twilio.com/try-twilio
    // Set TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE as Netlify Environment Variables
    // (DO NOT paste Twilio secret keys here — they are in Netlify dashboard)
    SMS_FUNCTION_URL: '/.netlify/functions/send-sms',  // Netlify serverless function

    // ─── FEATURE FLAGS ────────────────────────────────────────────────────────
    ENABLE_EMAIL_OTP: true,   // set false to disable email OTP
    ENABLE_SMS_OTP: false,   // set false to disable SMS OTP
    DEV_MODE: true           // enabled for seamless local testing and verification
};
