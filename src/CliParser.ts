import { exit } from "process";
import { parseArgs } from "util";

class CliParser {
  static parse() {
    const { values } = parseArgs({
      args: Bun.argv,
      options: {
        directory: {
          type: "string",
        },
        targetDomain: {
          type: "string",
        },
        limit: {
          type: "string",
        },
        perPage: {
          type: "string",
        },
      },
      strict: true,
      allowPositionals: true,
    });

    if (!values.directory || !values.targetDomain) {
      console.error(
        "Indiquez le répertoire des articles avec --directory et le domaine cible avec --targetDomain"
      );
      console.error(
        "Exemple : bun index.ts --directory ../content/articles --targetDomain http://localhost:2368"
      );
      exit(1);
    }

    return {
      directory: values.directory as string,
      targetDomain: values.targetDomain as string,
      limit: values.limit ? Number.parseInt(values.limit) : undefined,
      perPage: values.perPage ? Number.parseInt(values.perPage) : undefined,
    };
  }
}

export default CliParser;
