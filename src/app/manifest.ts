import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "manhwa-shelf",
    short_name: "manhwa-shelf",
    description: "Track and manage your manga & manhwa reading list",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#0a0a0f",
  };
}
