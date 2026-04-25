const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Groq } = require('groq-sdk');

const app = express();
app.use(cors());
app.use(express.json());

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

// Store session history in memory (in a real app, use a database or session store)
const sessions = {};

app.post('/api/chat', async (req, res) => {
    try {
        const { sessionId, message } = req.body;

        if (!sessions[sessionId]) {
            sessions[sessionId] = [
                { role: "system", content: systemPrompt }
            ];
        }

        if (message) {
            sessions[sessionId].push({ role: "user", content: message });
        }

        const completion = await groq.chat.completions.create({
            messages: sessions[sessionId],
            model: "llama3-70b-8192", // Using a solid Groq model
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
        });

        const reply = completion.choices[0].message.content;
        sessions[sessionId].push({ role: "assistant", content: reply });

        res.json({ reply });
    } catch (error) {
        console.error("Error communicating with Groq:", error);
        res.status(500).json({ error: "Failed to generate response." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
