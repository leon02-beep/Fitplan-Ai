export async function onRequestPost(context) {
    try {
        const rawResponse = await response.text();

let resultData;

try {
    resultData = JSON.parse(rawResponse);
} catch (e) {
    throw new Error(
        "Serverantwort: " + rawResponse.substring(0, 500)
    );
}

        if (!data.age || !data.height || !data.weight) {
            return new Response(
                JSON.stringify({
                    error: "Bitte Alter, Größe und Gewicht ausfüllen."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const prompt = `
Du bist FitPlan AI, ein professioneller Trainingsplan-Assistent.

Erstelle auf Deutsch einen individuellen Trainingsplan.

Alter: ${data.age}
Größe: ${data.height} cm
Gewicht: ${data.weight} kg
Ziel: ${data.goal}
Trainingstage: ${data.days} pro Woche
Trainingsort: ${data.location}
Equipment: ${data.equipment || "Kein spezielles Equipment"}
Erfahrung: ${data.experience}
Trainingsdauer: ${data.duration}
Beschwerden: ${data.problems || "Keine angegeben"}

Erstelle für jeden Trainingstag:
- Übungen
- Sätze
- Wiederholungen
- Pausen
- kurze Ausführungserklärung

Passe den Plan an das vorhandene Equipment an.
Bei Beschwerden keine medizinische Diagnose stellen und auf professionelle Beratung hinweisen.
`;

        const apiKey = context.env.GEMINI_API_KEY;

        if (!apiKey) {
            return new Response(
                JSON.stringify({
                    error: "GEMINI_API_KEY wurde nicht gefunden."
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const response = await fetch(
    window.location.origin + "/api/generate",
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error(result);

            return new Response(
                JSON.stringify({
                    error: "Gemini-Fehler: " +
                        (result.error?.message || "Unbekannter Fehler")
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const generatedText =
            result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            return new Response(
                JSON.stringify({
                    error: "Die KI hat keinen Trainingsplan zurückgegeben."
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({
                plan: generatedText
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (error) {
        console.error(error);

        return new Response(
            JSON.stringify({
                error: "Serverfehler: " + error.message
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
}
