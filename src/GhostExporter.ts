import { Glob } from "bun";
import MdParser from "./MdParser";
import path from "path";
import GhostBuilder from "./GhostBuilder";
import slugify from "slugify";

const mdGlob = new Glob("**/*.md");

class GhostExporter {
  private directory: string;
  private targetDomain: string;
  redirects: { "301": Record<string, string>[] };

  constructor(directory: string, targetDomain: string) {
    this.directory = directory;
    this.targetDomain = targetDomain;
    this.redirects = {
      301: [],
    };
  }

  async createExportObject(): Promise<SiteExport> {
    const builder = new GhostBuilder();
    const result = builder.initExport();

    let i = 0;

    for await (const file of mdGlob.scan(this.directory)) {
      const filePath = `${this.directory}/${file}`;

      const { data: metadata, content } = MdParser.parse(filePath);

      if (metadata.image) {
        metadata.image =
          "__GHOST_URL__" +
          metadata.image
            .replace("https://nostick.fr/articles", "/content/images")
            .toLocaleLowerCase();
      }

      let newContent = this.migratePostImages(path.dirname(file), content);
      newContent = this.migrateYoutubeShortcodes(newContent);
      newContent = this.migrateNostickLinks(newContent);
      const mobiledoc = builder.buildMobileDoc(newContent);
      const post = builder.buildPost(metadata, mobiledoc, file);

      this.redirects[301].push({
        [`/${post.slug}`]: `/${post.slug.replaceAll("/", "-")}`,
      });

      result.data.posts.push(post);
      i++;
    }

    console.log(`${i} articles intégrés pour import`);

    result.data.users = builder.authors;
    result.data.posts_authors = builder.postAuthors;
    result.data.tags = builder.tags;
    result.data.posts_tags = builder.postsTags;

    return result;
  }

  private migratePostImages(imgDir: string, content: string): string {
    // Markdown Image : ![Text](name.png Text)
    const mdImageRegex = /(!\[.*\]\()(.+\.\w+)( .*\)|\))/g;

    const targetImgDirSlugified = `content/images/${imgDir.toLocaleLowerCase()}`
      .split("/")
      .map((s) => slugify(s, { replacement: "-", lower: true }))
      .join("/");

    for (const match of content.matchAll(mdImageRegex)) {
      // Capture :
      // match[1]: ![Text](
      // match[2]: name.png
      // match[3]:  Text)
      content = content.replace(
        match[0],
        `${
          match[1]
        }__GHOST_URL__/${targetImgDirSlugified}/${match[2].toLocaleLowerCase()}${
          match[3]
        }`
      );
    }

    return content;
  }

  private migrateYoutubeShortcodes(content: string): string {
    // Youtube shortcode : {{< youtube WbbDQ1f1Yms >}}
    const ytShortcodeRegex = /\{\{< youtube (.+) >\}\}/g;

    for (const match of content.matchAll(ytShortcodeRegex)) {
      content = content.replace(
        match[0],
        `<iframe width="560" height="315" src="https://www.youtube.com/embed/${match[1]}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
      );
    }

    return content;
  }

  private migrateNostickLinks(content: string): string {
    return content.replace("https://nostick.fr", this.targetDomain);
  }
}

export default GhostExporter;
