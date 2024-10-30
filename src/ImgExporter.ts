import { Glob } from "bun";

class ImgExporter {
  private source: string;
  private destination: string;

  private extensions = ["jpg", "jpeg", "png"];

  constructor(source: string, destination: string) {
    this.source = source;
    this.destination = destination;
  }

  async run() {
    let total = 0;

    for (const ext of this.extensions) {
      console.log("analyzing ", ext);
      const imgGlob = new Glob(`**/*.${ext}`);

      for await (const file of imgGlob.scan(this.source)) {
        const img = Bun.file(`${this.source}/${file}`);
        await Bun.write(`${this.destination}/${file}`.toLocaleLowerCase(), img);
        total++;
      }
    }

    console.log(`Copied ${total} images`);
  }
}

export default ImgExporter;
