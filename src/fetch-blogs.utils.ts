/**
 * Blog Data Fetching
 * Server-side functions for fetching blog data
 */

import { getAPIClient } from "@otl-core/cms-api";
import type { Blog, BlogCategory, BlogPost } from "@otl-core/cms-types";

export async function fetchBlogs(): Promise<Blog[] | null> {
  try {
    const apiClient = getAPIClient();
    const deploymentId = apiClient.getDeploymentId();

    const response = await apiClient.blog.fetchBlogs(deploymentId);

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.warn("Failed to fetch blogs:", error);
    return null;
  }
}

export async function fetchBlogPosts(
  blogId: string,
  params?: { page?: number; limit?: number; category?: string }
): Promise<BlogPost[] | null> {
  try {
    const apiClient = getAPIClient();

    const response = await apiClient.blog.fetchBlogPosts(blogId, params);

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.warn("Failed to fetch blog posts:", error);
    return null;
  }
}

export async function fetchBlogPost(
  blogId: string,
  postSlug: string
): Promise<BlogPost | null> {
  try {
    const apiClient = getAPIClient();

    const response = await apiClient.blog.fetchBlogPost(blogId, postSlug);

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.warn("Failed to fetch blog post:", error);
    return null;
  }
}

export async function fetchBlogCategories(
  blogId: string
): Promise<BlogCategory[] | null> {
  try {
    const apiClient = getAPIClient();

    const response = await apiClient.blog.fetchBlogCategories(blogId);

    if (response.success && response.data) {
      return response.data as BlogCategory[];
    }

    return null;
  } catch (error) {
    console.warn("Failed to fetch blog categories:", error);
    return null;
  }
}
