import matter from "gray-matter";
import toml from "toml";

interface MdParseResult {
  data: MarkdownMetadata;
  content: string;
}

class MdParser {
  static parse(filepath: string): MdParseResult {
    const markdownOutput = matter.read(filepath, {
      delimiters: "+++",
      engines: {
        toml: toml.parse.bind(toml),
      },
      language: "toml",
    });

    return {
      data: markdownOutput.data as MarkdownMetadata,
      content: markdownOutput.content,
    };
  }
}

export default MdParser;
