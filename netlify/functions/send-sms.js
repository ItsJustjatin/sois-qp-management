// netlify/functions/send-sms.js
// Twilio SMS OTP Sender — credentials stay safely server-side as Netlify env vars
// Set these in Netlify Dashboard → Site Settings → Environment Variables:
//   TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { phone, otp, name } = JSON.parse(event.body || '{}');

        if (!phone || !otp) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'phone and otp are required' }) };
        }

        const accountSid = process.env.TWILIO_SID;
        const authToken = process.env.TWILIO_TOKEN;
        const fromPhone = process.env.TWILIO_PHONE;

        if (!accountSid || !authToken || !fromPhone) {
            return {
                statusCode: 503,
                headers,
                body: JSON.stringify({ error: 'SMS service not configured. Please set TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE in Netlify environment variables.' })
            };
        }

        const message = `SOIS QP Portal OTP\nHello ${name || 'User'},\nYour verification code is: ${otp}\nValid for 10 minutes. Do not share this code.\n- Presidency University SOIS`;

        // Call Twilio REST API
        const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const body = new URLSearchParams({
            To: phone.startsWith('+') ? phone : `+91${phone}`,
            From: fromPhone,
            Body: message
        }).toString();

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Twilio error:', result);
            return { statusCode: 502, headers, body: JSON.stringify({ error: result.message || 'SMS send failed' }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, sid: result.sid }) };

    } catch (err) {
        console.error('SMS function error:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
    }
};
