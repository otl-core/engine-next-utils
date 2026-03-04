/**
 * Collection Data Fetching
 * Server-side functions for fetching collection data
 */

import { getAPIClient } from "@otl-core/cms-api";
import type { Collection, Category, Entry } from "@otl-core/cms-types";

export async function fetchCollections(): Promise<Collection[] | null> {
  try {
    const apiClient = getAPIClient();
    const siteId = apiClient.getSiteId();

    const response = await apiClient.collection.fetchCollections(siteId);

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.warn("Failed to fetch collections:", error);
    return null;
  }
}

export async function fetchEntries(
  collectionId: string,
  params?: { page?: number; limit?: number; category?: string },
): Promise<Entry[] | null> {
  try {
    const apiClient = getAPIClient();

    const response = await apiClient.collection.fetchEntries(
      collectionId,
      params,
    );

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.warn("Failed to fetch entries:", error);
    return null;
  }
}

export async function fetchEntry(
  collectionId: string,
  postSlug: string,
): Promise<Entry | null> {
  try {
    const apiClient = getAPIClient();

    const response = await apiClient.collection.fetchEntry(
      collectionId,
      postSlug,
    );

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.warn("Failed to fetch entry:", error);
    return null;
  }
}

export async function fetchCategories(
  collectionId: string,
): Promise<Category[] | null> {
  try {
    const apiClient = getAPIClient();

    const response = await apiClient.collection.fetchCategories(collectionId);

    if (response.success && response.data) {
      return response.data as Category[];
    }

    return null;
  } catch (error) {
    console.warn("Failed to fetch categories:", error);
    return null;
  }
}
