import { type NextRequest, NextResponse } from "next/server";

// Mark the route as dynamic to prevent caching
export const dynamic = "force-dynamic";

// API credentials
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY || ""; // Add Freepik API key to your environment variables

export async function GET(request: NextRequest) {
  try {
    // Get the search query from URL parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    // Helper function to randomly select an image from results
    const selectRandomImage = (results: any[]) => {
      if (results && results.length > 0) {
        const randomIndex = Math.floor(Math.random() * results.length);
        return results[randomIndex];
      }
      return null;
    };

    // 1. Try Freepik API first (if API key is available)
    if (FREEPIK_API_KEY) {
      // Introduce randomness by selecting a random page (e.g., between 1 and 50)
      const randomPage = Math.floor(Math.random() * 50) + 1;

      const response = await fetch(
        `https://api.freepik.com/v1/resources?term=${encodeURIComponent(
          query
        )}&page=${randomPage}&limit=5&filters[content_type]=photo&filters[orientation]=landscape`,
        {
          headers: {
            "x-freepik-api-key": FREEPIK_API_KEY,
            "Accept-Language": "en-US", // Optional: Set language for search results
          },
          cache: "no-store", // Prevent caching
        }
      );

      if (!response.ok) {
        console.error(`Freepik API error: ${response.statusText}`);
      } else {
        const data = await response.json();

        // Transform Freepik response to match the expected format (similar to Unsplash)
        const transformedResults = data.data.map((resource: any) => ({
          id: resource.id,
          urls: {
            raw: resource.image?.source?.url || "",
            full: resource.image?.source?.url || "",
            regular: resource.image?.source?.url || "",
            small: resource.image?.source?.url || "",
            thumb: resource.image?.source?.url || "",
          },
          user: {
            name: resource.author?.name || "Freepik",
            links: {
              html: resource.author?.url || "https://www.freepik.com",
            },
          },
        }));

        const selectedImage = selectRandomImage(transformedResults);
        if (selectedImage) {
          return NextResponse.json({ results: [selectedImage] });
        }
      }
    }

    // 2. Fallback to Unsplash API if Freepik fails or no API key
    if (UNSPLASH_ACCESS_KEY) {
      const randomPage = Math.floor(Math.random() * 10) + 1;

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query
        )}&per_page=5&orientation=landscape&page=${randomPage}`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.statusText}`);
      }

      const data = await response.json();
      const selectedImage = selectRandomImage(data.results);
      if (selectedImage) {
        return NextResponse.json({ results: [selectedImage] });
      } else {
        return NextResponse.json({ results: [] });
      }
    }

    // 3. Fallback to Pexels API if Unsplash fails or no API key
    if (PEXELS_API_KEY) {
      const randomPage = Math.floor(Math.random() * 10) + 1;

      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          query
        )}&per_page=5&orientation=landscape&page=${randomPage}`,
        {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.statusText}`);
      }

      const data = await response.json();

      const transformedData = {
        results: data.photos.map((photo: any) => ({
          id: photo.id,
          urls: {
            raw: photo.src.original,
            full: photo.src.original,
            regular: photo.src.large,
            small: photo.src.medium,
            thumb: photo.src.small,
          },
          user: {
            name: photo.photographer,
            links: {
              html: photo.photographer_url,
            },
          },
        })),
      };

      const selectedImage = selectRandomImage(transformedData.results);
      if (selectedImage) {
        return NextResponse.json({ results: [selectedImage] });
      } else {
        return NextResponse.json({ results: [] });
      }
    }

    // 4. Final fallback with placeholder images
    return NextResponse.json({
      results: [
        {
          id: "fallback1",
          urls: {
            regular: `https://source.unsplash.com/1600x900/?${encodeURIComponent(
              query
            )}&random=${Math.random()}`,
          },
          user: {
            name: "Unsplash",
            links: {
              html: "https://unsplash.com",
            },
          },
        },
      ],
    });
  } catch (error) {
    console.error("Error in image search API:", error);
    return NextResponse.json({ error: "Failed to search for images" }, { status: 500 });
  }
}