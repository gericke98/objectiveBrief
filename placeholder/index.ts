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
Act as a Spanish news editor. Return the top 10 trending news from Spain today in the category "${category}".
Return ONLY a valid JSON array with objects containing "title" and "summary" fields.
Do not include any markdown formatting or additional text.
Example format: [{"title": "News Title", "summary": "News Summary"}]
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
