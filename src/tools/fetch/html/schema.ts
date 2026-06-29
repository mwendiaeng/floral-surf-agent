/**
 * html/schema.ts
 *
 * Schema.org extraction and normalization.
 *
 * Responsibilities:
 *  - JSON-LD parsing
 *  - @graph flattening
 *  - Schema normalization
 *  - Entity extraction
 *  - Query helpers
 */

import type { SchemaOrgData } from "./types";

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */

export interface SchemaGraph {
  nodes: SchemaOrgData[];
}

export interface SchemaEntity {
  id?: string;

  type: string;

  properties: Record<string, unknown>;
}

export interface ExtractedArticle {
  headline?: string;

  description?: string;

  datePublished?: string;

  dateModified?: string;

  author?: string;

  publisher?: string;

  image?: string;
}

export interface ExtractedOrganization {
  name?: string;

  url?: string;

  logo?: string;

  sameAs: string[];
}

export interface ExtractedPerson {
  name?: string;

  url?: string;

  image?: string;
}

export interface ExtractedBreadcrumb {
  position: number;

  name: string;

  item?: string;
}

/* -------------------------------------------------------------------------- */
/*                             Public API                                     */
/* -------------------------------------------------------------------------- */

export function normalizeSchema(jsonLd: unknown[]): SchemaGraph {
  const nodes = new Map<string, SchemaOrgData>();

  for (const value of jsonLd) {
    collect(
      value,

      nodes
    );
  }

  return {
    nodes: Array.from(nodes.values())
  };
}

/* -------------------------------------------------------------------------- */
/*                            Graph Walker                                    */
/* -------------------------------------------------------------------------- */

function collect(
  value: unknown,

  nodes: Map<string, SchemaOrgData>
): void {
  if (value == null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collect(
        item,

        nodes
      );
    }

    return;
  }

  if (typeof value !== "object") {
    return;
  }

  const object = value as Record<string, unknown>;

  /*
   * Support @graph
   */

  const graph = object["@graph"];

  if (Array.isArray(graph)) {
    for (const node of graph) {
      collect(
        node,

        nodes
      );
    }
  }

  const type = object["@type"] ?? object.type;

  if (typeof type !== "string") {
    return;
  }

  const id =
    typeof object["@id"] === "string"
      ? object["@id"]
      : `${type}:${JSON.stringify(object)}`;

  if (nodes.has(id)) {
    return;
  }

  nodes.set(id, {
    type,

    properties: object
  });
}

/* -------------------------------------------------------------------------- */
/*                             Query Helpers                                  */
/* -------------------------------------------------------------------------- */

export function getEntities(
  graph: SchemaGraph,

  type: string
): SchemaOrgData[] {
  return graph.nodes.filter((node) => node.type === type);
}

export function firstEntity(
  graph: SchemaGraph,

  type: string
): SchemaOrgData | undefined {
  return graph.nodes.find((node) => node.type === type);
}

/* -------------------------------------------------------------------------- */
/* Article Extraction                                                         */
/* -------------------------------------------------------------------------- */

export function extractArticle(
  graph: SchemaGraph
): ExtractedArticle | undefined {
  const article =
    firstEntity(graph, "Article") ??
    firstEntity(graph, "NewsArticle") ??
    firstEntity(graph, "BlogPosting");

  if (!article) {
    return;
  }

  const p = article.properties;

  return {
    headline: asString(p.headline),

    description: asString(p.description),

    datePublished: asString(p.datePublished),

    dateModified: asString(p.dateModified),

    author: extractName(p.author),

    publisher: extractName(p.publisher),

    image: extractImage(p.image)
  };
}

/* -------------------------------------------------------------------------- */
/* Organization Extraction                                                    */
/* -------------------------------------------------------------------------- */

export function extractOrganization(
  graph: SchemaGraph
): ExtractedOrganization | undefined {
  const organization = firstEntity(
    graph,

    "Organization"
  );

  if (!organization) {
    return;
  }

  const p = organization.properties;

  return {
    name: asString(p.name),

    url: asString(p.url),

    logo: extractImage(p.logo),

    sameAs: asStringArray(p.sameAs)
  };
}

/* -------------------------------------------------------------------------- */
/* Person Extraction                                                          */
/* -------------------------------------------------------------------------- */

export function extractPerson(graph: SchemaGraph): ExtractedPerson[] {
  return getEntities(
    graph,

    "Person"
  ).map((entity) => {
    const p = entity.properties;

    return {
      name: asString(p.name),

      url: asString(p.url),

      image: extractImage(p.image)
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Breadcrumb Extraction                                                      */
/* -------------------------------------------------------------------------- */

export function extractBreadcrumbs(graph: SchemaGraph): ExtractedBreadcrumb[] {
  const breadcrumb = firstEntity(
    graph,

    "BreadcrumbList"
  );

  if (!breadcrumb) {
    return [];
  }

  const items = breadcrumb.properties.itemListElement;

  if (!Array.isArray(items)) {
    return [];
  }

  return items

    .map((item) => {
      if (typeof item !== "object" || item == null) {
        return undefined;
      }

      const value = item as Record<string, unknown>;

      return {
        position: Number(value.position ?? 0),

        name: asString(value.name) ?? "",

        item: asString(value.item)
      } as ExtractedBreadcrumb;
    })

    .filter((value): value is ExtractedBreadcrumb => value !== undefined)

    .sort((a, b) => a.position - b.position);
}

/* -------------------------------------------------------------------------- */
/* String Helpers                                                             */
/* -------------------------------------------------------------------------- */

// function asString(
//     value: unknown
// ): string | undefined {

//     if (

//         typeof value === "string"

//     ) {

//         return value;

//     }

//     return;

// }

// function asStringArray(
//     value: unknown
// ): string[] {

//     if (

//         Array.isArray(value)

//     ) {

//         return value

//             .map(item => asString(item))

//             .filter(

//                 (

//                     item

//                 ): item is string =>

//                     item !== undefined

//             );

//     }

//     return [];

// }

/* -------------------------------------------------------------------------- */
/* Image Helpers                                                              */
/* -------------------------------------------------------------------------- */

function extractImage(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return extractImage(value[0]);
  }

  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;

    return asString(object.url) ?? asString(object.contentUrl);
  }

  return;
}

/* -------------------------------------------------------------------------- */
/* Name Helpers                                                               */
/* -------------------------------------------------------------------------- */

function extractName(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return extractName(value[0]);
  }

  if (value && typeof value === "object") {
    return asString((value as Record<string, unknown>).name);
  }

  return;
}

/* -------------------------------------------------------------------------- */
/* FAQ Extraction                                                             */
/* -------------------------------------------------------------------------- */

export function extractFAQ(graph: SchemaGraph): Record<string, string>[] {
  const faq = firstEntity(graph, "FAQPage");

  if (!faq) {
    return [];
  }

  const questions = faq.properties.mainEntity;

  if (!Array.isArray(questions)) {
    return [];
  }

  return questions.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const q = item as Record<string, unknown>;

    return [
      {
        question: asString(q.name) ?? "",

        answer: extractAnswer(q.acceptedAnswer) ?? ""
      }
    ];
  });
}

/* -------------------------------------------------------------------------- */
/* Recipe Extraction                                                          */
/* -------------------------------------------------------------------------- */

export function extractRecipe(
  graph: SchemaGraph
): Record<string, unknown> | undefined {
  const recipe = firstEntity(graph, "Recipe");

  if (!recipe) {
    return;
  }

  return {
    name: asString(recipe.properties.name),

    description: asString(recipe.properties.description),

    image: extractImage(recipe.properties.image),

    author: extractName(recipe.properties.author),

    prepTime: asString(recipe.properties.prepTime),

    cookTime: asString(recipe.properties.cookTime),

    totalTime: asString(recipe.properties.totalTime),

    recipeYield: asString(recipe.properties.recipeYield),

    ingredients: asStringArray(recipe.properties.recipeIngredient)
  };
}

/* -------------------------------------------------------------------------- */
/* Product Extraction                                                         */
/* -------------------------------------------------------------------------- */

export function extractProduct(
  graph: SchemaGraph
): Record<string, unknown> | undefined {
  const product = firstEntity(graph, "Product");

  if (!product) {
    return;
  }

  return {
    name: asString(product.properties.name),

    description: asString(product.properties.description),

    image: extractImage(product.properties.image),

    sku: asString(product.properties.sku),

    brand: extractName(product.properties.brand)
  };
}

/* -------------------------------------------------------------------------- */
/* Event Extraction                                                           */
/* -------------------------------------------------------------------------- */

export function extractEvent(
  graph: SchemaGraph
): Record<string, unknown> | undefined {
  const event = firstEntity(graph, "Event");

  if (!event) {
    return;
  }

  return {
    name: asString(event.properties.name),

    description: asString(event.properties.description),

    startDate: asString(event.properties.startDate),

    endDate: asString(event.properties.endDate),

    location: extractName(event.properties.location),

    organizer: extractName(event.properties.organizer)
  };
}

/* -------------------------------------------------------------------------- */
/* Lookup Helpers                                                             */
/* -------------------------------------------------------------------------- */

export function hasType(graph: SchemaGraph, type: string): boolean {
  return graph.nodes.some((node) => node.type === type);
}

export function findByType(
  graph: SchemaGraph,
  type: string
): SchemaOrgData | undefined {
  return firstEntity(
    graph,

    type
  );
}

export function findAllByType(
  graph: SchemaGraph,
  type: string
): SchemaOrgData[] {
  return getEntities(
    graph,

    type
  );
}

/* -------------------------------------------------------------------------- */
/* Primitive Helpers                                                          */
/* -------------------------------------------------------------------------- */

export function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value

      .filter((v): v is string => typeof v === "string")

      .map((v) => v.trim());
  }

  if (typeof value === "string") {
    return [value.trim()];
  }

  return [];
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return;
}

export function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return;
}

function extractAnswer(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    return asString((value as Record<string, unknown>).text);
  }

  return;
}
