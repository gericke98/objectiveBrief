export const SOURCES = [
  "El País",
  "El Mundo",
  "ABC",
  "La Vanguardia",
  "El Confidencial",
];

export const CATEGORIES = [
  "actualidad",
  "economía",
  "tecnología",
  "política",
  "deportes",
  "cultura",
  "sociedad",
  "internacional",
];

export const NAME = "The Objective Brief";

export function getTrendingPrompt(category: string) {
  return `
Please return a list of the 5 most relevant news stories from Spain from the past 24 hours that are relevant to the category "${category}".

Sources (use exclusively):

OK Diario
El Mundo
El Confidencial
El País
The Huffington Post (Spain)
Instructions:

Include only high-impact political, economic, social, or geopolitical news.
Exclude trivial, viral, entertainment, or low-relevance stories.
Ensure all news is published within the past 24 hours.
If a story appears in multiple sources, select the version with the most original coverage.
For each news item, return:

"title": the headline of the article
"summary": a short summary (2 or 3 lines)
Output format: Return ONLY a valid JSON array of objects, each containing a "title" and "summary" field.
Do not include any markdown formatting, comments, or additional text.

Example output: [ { "title": "News Title", "summary": "News Summary" } ]

If fewer than 5 qualifying stories are found, return only the ones available.
`;
}

export function getObjectivityPrompt(item: { title: string; summary: string }) {
  return `
          Eres un periodista imparcial. Escribe un resumen objetivo de la siguiente noticia utilizando información de los principales medios españoles: ${SOURCES.join(
            ", "
          )}.

          Título: ${item.title}
          Resumen: ${item.summary}

          Proporciona una síntesis clara e imparcial (máximo 150 palabras).
          Además, para cada fuente (${SOURCES.join(
            ", "
          )}), proporciona un resumen muy breve (máximo 50 palabras) de su perspectiva sobre esta noticia.
          Formatea la respuesta como un objeto JSON con los campos "summary" y "sources", donde "sources" es un array de objetos con los campos "name" y "summary".
          Formato de ejemplo:
          {
            "summary": "Resumen objetivo aquí...",
            "sources": [
              {
                "name": "Nombre de la Fuente",
                "summary": "Resumen breve de esta fuente..."
              }
            ]
          }
          `;
}
