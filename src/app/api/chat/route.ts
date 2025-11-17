import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    // Replace with your actual Gemini API key from environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        {
          response:
            'Olá! No momento estou com dificuldades técnicas. Por favor, entre em contato pelo WhatsApp: (11) 99999-9999'
        },
        { status: 200 }
      )
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Você é um assistente virtual da Donatti Turismo, uma agência de viagens brasileira especializada em viagens internacionais. 
                  Seja prestativo, amigável e profissional. Ajude os clientes com informações sobre destinos, pacotes, documentação necessária e dicas de viagem.
                  Se não souber algo específico, sugira que entrem em contato pelo WhatsApp: (11) 99999-9999.
                  
                  Pergunta do cliente: ${message}`
                }
              ]
            }
          ]
        })
      }
    )

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não entendi. Pode reformular?'

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('[v0] Chat API error:', error)
    return NextResponse.json(
      {
        response: 'Desculpe, houve um erro. Por favor, tente novamente ou entre em contato pelo WhatsApp: (11) 99999-9999'
      },
      { status: 200 }
    )
  }
}
