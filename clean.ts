/** @ts-ignore */
import GhostAdminAPI from "@tryghost/admin-api";
import fs from "node:fs/promises";

await fs.rm("dist", { recursive: true });

const api = new GhostAdminAPI({
  url: Bun.env.GHOST_URL,
  key: Bun.env.GHOST_ADMIN_API_KEY,
  version: "v5.0",
});

const posts = await api.posts.browse({ limit: "all" });

for (const post of posts) {
  console.log("Deleting %s - %s", post.id, post.title);
  await api.posts.delete({ id: post.id });
}
