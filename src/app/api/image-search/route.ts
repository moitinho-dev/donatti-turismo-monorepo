import { type NextRequest, NextResponse } from "next/server";

// Mark the route as dynamic to prevent caching
export const dynamic = "force-dynamic";

// Unsplash API credentials
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

export async function GET(request: NextRequest) {
  try {
    // Get the search query from URL parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    // If we have an Unsplash API key, use it
    if (UNSPLASH_ACCESS_KEY) {
      // Introduce randomness by selecting a random page (e.g., between 1 and 10)
      const randomPage = Math.floor(Math.random() * 10) + 1;

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query
        )}&per_page=5&orientation=landscape&page=${randomPage}`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
          // Prevent caching to ensure fresh results
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Randomly select one image from the results to further increase variability
      if (data.results && data.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.results.length);
        const selectedImage = data.results[randomIndex];
        return NextResponse.json({ results: [selectedImage] });
      } else {
        return NextResponse.json({ results: [] });
      }
    }
    // Fallback to Pexels API if no Unsplash key
    else {
      const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";

      if (PEXELS_API_KEY) {
        // Introduce randomness by selecting a random page for Pexels
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

        // Transform Pexels response to match Unsplash format
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

        // Randomly select one image from the results
        if (transformedData.results && transformedData.results.length > 0) {
          const randomIndex = Math.floor(Math.random() * transformedData.results.length);
          const selectedImage = transformedData.results[randomIndex];
          return NextResponse.json({ results: [selectedImage] });
        } else {
          return NextResponse.json({ results: [] });
        }
      }

      // If no API keys are available, use a fallback with placeholder images
      return NextResponse.json({
        results: [
          {
            id: "fallback1",
            urls: {
              regular: `https://source.unsplash.com/1600x900/?${encodeURIComponent(
                query
              )}&random=${Math.random()}`, // Add random parameter to prevent caching
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
    }
  } catch (error) {
    console.error("Error in image search API:", error);
    return NextResponse.json({ error: "Failed to search for images" }, { status: 500 });
  }
}