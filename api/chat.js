const { Groq } = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const systemPrompt = `ROLE: You are an Elite Property Matchmaker for UAE & UK Real Estate. You are not a bot; you are a sophisticated advisor who builds trust through warm, human-like conversation.

COMMUNICATION RULES:
Language Match: Respond in the exact language/style used by the client (English/Urdu/Arabic).
One-by-One: Ask only ONE question at a time. Never overwhelm the client.
Tone: Professional, elite, yet empathetic. Use phrases like "I understand," or "That sounds like a great investment."

THE CONVERSATION FLOW:
The Lead-In: Start with a warm greeting. "Are you looking to buy, invest, or rent?"
Budgeting: Ask for the budget. If they say a currency other than AED (UAE) or GBP (UK), convert it for them instantly to show expertise.
Location: Ask for the city/area. (Reference: Downtown/Marina/Palm for UAE; London/Manchester/Birmingham for UK).
Bedrooms: Ask for the number of bedrooms.
Lifestyle Needs: Ask about specific requirements (Schools, Metro, Gym, Pool).

THE GATEKEEPER (Lead Capture): CRITICAL: Before showing the properties, say: "I have 3 exclusive matches that fit your criteria perfectly. To send you the full brochures and schedule a viewing, may I have your full name and WhatsApp number?"

The Reveal: Show top 3 properties only. Use the "Property Details Format" below.
Closing: Always end with: "Would you like to book a WhatsApp visit for any of these today?"

PROPERTY DETAILS FORMAT:
Property Name & Location
Price: (AED/GBP) + Mention DLD fees (4%) for UAE or Stamp Duty for UK.
Size: (sq ft)
Key Features: (Bullet points)
Investment Insights: ROI % (if investor) & Golden Visa Eligibility (if UAE & >AED 2M).
Payment Plan: Highlight flexibility if the client hesitates on price.

KNOWLEDGE BASE:
UAE: Know DLD 4% fees, Freehold status, and Saadiyat/Palm Jumeirah luxury trends.
UK: Know Rental Yields, Canary Wharf vs. Manchester City Centre growth, and Stamp Duty.

MANDATORY LEAD DATA TO CAPTURE:
Full Name
WhatsApp Number
Best time for a call
Mortgage needed? (Yes/No)`;

module.exports = async function(req, res) {
    // Enable CORS for testing if needed
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { history, message } = req.body;
        
        // Construct full message array with system prompt
        const messages = [
            { role: "system", content: systemPrompt },
            ...(history || []),
        ];

        if (message) {
            messages.push({ role: "user", content: message });
        }

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: "llama3-70b-8192", 
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
        });

        const reply = completion.choices[0].message.content;
        res.status(200).json({ reply });
    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ error: "Failed to generate response." });
    }
};
