import { Glob } from "bun";
import MdParser from "./MdParser";
import path from "path";
import GhostBuilder from "./GhostBuilder";

const mdGlob = new Glob("**/*.md");

class GhostExporter {
  private directory: string;
  private targetDomain: string;

  constructor(directory: string, targetDomain: string) {
    this.directory = directory;
    this.targetDomain = targetDomain;
  }

  async createExportObject(): Promise<SiteExport> {
    const builder = new GhostBuilder();
    const result = builder.initExport();

    let i = 0;

    for await (const file of mdGlob.scan(this.directory)) {
      const filePath = `${this.directory}/${file}`;

      const { data: metadata, content } = MdParser.parse(filePath);

      if (metadata.image) {
        metadata.image = metadata.image
          .replace("https://nostick.fr/articles", `${this.targetDomain}`)
          .toLocaleLowerCase();
      }

      const newContent = this.migratePostImages(path.dirname(file), content);
      const mobiledoc = builder.buildMobileDoc(newContent);
      const post = builder.buildPost(metadata, mobiledoc, file);

      result.data.posts.push(post);
      i++;
    }

    result.data.users = builder.authors;

    console.log(`${i} articles intégrés pour import`);

    return result;
  }

  private migratePostImages(imgDir: string, content: string): string {
    // Markdown Image : ![Text](name.png Text)
    const mdImageRegex = /(!\[.*\]\()(.+\.\w+)( .*\))/g;

    const targetImgDirUrlEncoded = encodeURI(
      `content/images/${imgDir.toLocaleLowerCase()}`
    );

    for (const match of content.matchAll(mdImageRegex)) {
      // Capture :
      // match[1]: ![Text](
      // match[2]: name.png
      // match[3]:  Text)
      content = content.replace(
        match[0],
        `${match[1]}${
          this.targetDomain
        }/${targetImgDirUrlEncoded}/${match[2].toLocaleLowerCase()}${match[3]}`
      );
    }

    return content;
  }
}

export default GhostExporter;
