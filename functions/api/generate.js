export async function onRequestPost(context) {

    try {

        const data = await context.request.json();

        if (!data.age || !data.height || !data.weight) {

            return new Response(
                JSON.stringify({
                    error: "Bitte fülle Alter, Größe und Gewicht aus."
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
Du bist FitPlan AI, ein digitaler Trainingsplan-Assistent.

Erstelle einen individuellen Trainingsplan anhand dieser Angaben:

Alter: ${data.age}
Größe: ${data.height} cm
Gewicht: ${data.weight} kg
Ziel: ${data.goal}
Trainingstage: ${data.days} pro Woche
Trainingsort: ${data.location}
Equipment: ${data.equipment || "Kein spezielles Equipment"}
Erfahrung: ${data.experience}
Trainingsdauer: ${data.duration}
Beschwerden/Verletzungen: ${data.problems || "Keine angegeben"}

REGELN:

- Schreibe auf Deutsch.
- Passe den Plan an Ziel, Erfahrung, Trainingsort und Equipment an.
- Gib für jede Übung Sätze, Wiederholungen und Pausen an.
- Erkläre jede Übung kurz.
- Verwende nur Übungen, die mit dem angegebenen Equipment möglich sind.
- Übertreibe das Trainingsvolumen nicht.
- Versprich keine bestimmten Ergebnisse.
- Stelle keine medizinischen Diagnosen.
- Bei Verletzungen oder Beschwerden soll die Person professionelle medizinische Beratung einholen.

FORMAT:

# Mein Trainingsplan

## Wochenübersicht

Erkläre kurz den Aufbau der Woche.

## Tag 1

Übung:
Sätze:
Wiederholungen:
Pause:
Ausführung:

## Tag 2

Übung:
Sätze:
Wiederholungen:
Pause:
Ausführung:

Erstelle entsprechend der Anzahl der Trainingstage weitere Trainingstage.

## Fortschritt

Erkläre kurz, wie die Belastung sinnvoll gesteigert werden kann.
`;

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
            context.env.GEMINI_API_KEY,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
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

        if (!response.ok) {

            console.error(await response.text());

            return new Response(
                JSON.stringify({
                    error: "Die KI konnte momentan keinen Trainingsplan erstellen."
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const result = await response.json();

        const generatedText =
            result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {

            return new Response(
                JSON.stringify({
                    error: "Die KI hat keine Antwort geliefert."
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
                error: "Ein unerwarteter Fehler ist aufgetreten."
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
