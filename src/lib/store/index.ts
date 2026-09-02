import { fileStore, phoneKey } from "./file-store";

/**
 * Point d'accès unique aux données.
 *
 * Toute l'application passe par `store`. Changer de base de données revient à
 * fournir un objet exposant les mêmes méthodes (voir README § Base de données)
 * sans toucher aux pages, aux composants ni aux routes d'API.
 */
export const store = fileStore;
export type Store = typeof store;
export { phoneKey };
export * from "./types";
