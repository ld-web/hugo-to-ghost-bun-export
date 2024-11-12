import { Glob } from "bun";
import MdParser from "./MdParser";
import path from "path";
import GhostBuilder from "./GhostBuilder";
import slugify from "slugify";

class GhostExporter {
  private directory: string;
  private targetDirectory: string;
  private targetDomain: string;
  private mdFiles: string[] = [];

  constructor(
    directory: string,
    targetDirectory: string,
    targetDomain: string
  ) {
    this.directory = directory;
    this.targetDirectory = targetDirectory;
    this.targetDomain = targetDomain;
  }

  async export({ limit, perPage }: ExportOptions): Promise<void> {
    await this.exploreAndRegisterMdFiles(limit);
    const { itemsPerPage, totalPages } = this.buildPagination(perPage);

    for (let page = 1; page <= totalPages; page++) {
      const builder = new GhostBuilder();
      const result = builder.initExport();

      for (
        let itemIndex = (page - 1) * itemsPerPage;
        itemIndex < page * itemsPerPage;
        itemIndex++
      ) {
        const file = this.mdFiles[itemIndex];
        const filePath = `${this.directory}/${file}`;
        const { data: metadata, content } = MdParser.parse(filePath);

        if (metadata.image) {
          await this.migrateFeaturedImage(page, metadata);
        }

        let newContent = await this.migratePostImages(
          page,
          path.dirname(file),
          content
        );
        newContent = this.migrateYoutubeShortcodes(newContent);
        const mobiledoc = builder.buildMobileDoc(newContent);
        const post = builder.buildPost(metadata, mobiledoc, file);

        result.data.posts.push(post);
      }

      result.data.users = GhostBuilder.authors;
      result.data.posts_authors = builder.postAuthors;
      result.data.tags = GhostBuilder.tags;
      result.data.posts_tags = builder.postsTags;

      const bytes = await Bun.write(
        `${this.targetDirectory}/${page}/output.json`,
        JSON.stringify(result)
      );
      console.log(`Page ${page}/${totalPages}: ${bytes} bytes written`);
    }
  }

  private async exploreAndRegisterMdFiles(
    limit: number | undefined
  ): Promise<void> {
    const mdGlob = new Glob("**/*.md");
    let total = 0;

    for await (const file of mdGlob.scan(this.directory)) {
      this.mdFiles.push(file);
      total++;

      if (total === limit) {
        break;
      }
    }

    console.log(`${total} articles enregistrés pour import`);
  }

  private buildPagination(perPage: number | undefined): {
    totalPages: number;
    itemsPerPage: number;
  } {
    const itemsPerPage =
      perPage && perPage < this.mdFiles.length ? perPage : this.mdFiles.length;
    const totalPages = Math.ceil(this.mdFiles.length / itemsPerPage);

    return { totalPages, itemsPerPage };
  }

  private async migrateFeaturedImage(
    page: number,
    metadata: MarkdownMetadata
  ): Promise<void> {
    const baseStartUrl = "https://nostick.fr/articles";

    if (metadata.image.includes("vignettes")) {
      const imgPathWithoutBaseStart = metadata.image.replace(
        `${baseStartUrl}`,
        ""
      );

      const imgPath = this.directory + imgPathWithoutBaseStart;
      const targetPath = `${
        this.targetDirectory
      }/${page}${imgPathWithoutBaseStart.toLocaleLowerCase()}`;

      const img = Bun.file(imgPath);

      await Bun.write(targetPath, img);
    }

    metadata.image = metadata.image
      .replace(baseStartUrl, this.targetDomain)
      .toLocaleLowerCase();
  }

  private async migratePostImages(
    page: number,
    imgDir: string,
    content: string
  ): Promise<string> {
    // Markdown Image : ![Text](name.png Text)
    const mdImageRegex = /(!\[.*\]\()(.+\.\w+)( \".*\"\)|\))/g;

    const imgDirSlugified = imgDir
      .toLocaleLowerCase()
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
        `${match[1]}${
          this.targetDomain
        }/content/images/${imgDirSlugified}/${match[2].toLocaleLowerCase()}${
          match[3]
        }`
      );

      const img = Bun.file(`${this.directory}/${imgDir}/${match[2]}`);

      await Bun.write(
        `${
          this.targetDirectory
        }/${page}/${imgDirSlugified}/${match[2].toLocaleLowerCase()}`,
        img
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
}

export default GhostExporter;
