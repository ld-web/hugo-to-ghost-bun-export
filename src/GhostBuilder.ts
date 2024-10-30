import slugify from "slugify";

class GhostBuilder {
  static postId = 1;
  static userId = 1;

  authors: User[] = [];

  initExport(): SiteExport {
    return {
      meta: {
        exported_on: Date.parse("2024-10-29"),
        version: "2.14.0",
      },
      data: {
        posts: [],
        posts_tags: [],
        tags: [],
        users: [],
      },
    };
  }

  buildMobileDoc(markdownContent: string): string {
    return JSON.stringify({
      version: "0.3.1",
      markups: [],
      atoms: [],
      cards: [
        [
          "markdown",
          {
            cardName: "markdown",
            markdown: markdownContent,
          },
        ],
      ],
      sections: [[10, 0]],
    });
  }

  buildPost(
    metadata: MarkdownMetadata,
    mobiledoc: string,
    filepath: string
  ): Post {
    const author = this.findOrCreateAuthor(metadata.author);

    const post: Post = {
      id: GhostBuilder.postId++,
      title: metadata.title ?? "title",
      slug: this.buildSlug(filepath),
      mobiledoc,
      page: 0,
      published_at: Date.parse(metadata.date),
      created_at: Date.parse(metadata.date),
      status: metadata.draft ? "draft" : "published",
      feature_image: metadata.image,
      meta_title: metadata.title ?? "title",
      author_id: author.id,
      created_by: author.id,
    };

    return post;
  }

  findOrCreateAuthor(name: string): User {
    let author = this.authors.find((u) => u.name === name);

    if (author === undefined) {
      const id = GhostBuilder.userId++;

      author = {
        id,
        name,
        email: `email${id}@nostick.fr`,
      };

      this.authors.push(author);
    }

    return author;
  }

  buildSlug(filepath: string): string {
    filepath = filepath.replace(".md", "");
    filepath = filepath.replace("/index", "");
    filepath = filepath
      .split("/")
      .map((s) => slugify(s, { replacement: "-", lower: true }))
      .join("/");

    return "articles/" + filepath;
  }
}

export default GhostBuilder;
