import { createReadStream, createWriteStream, readdirSync, statSync } from "fs";
import { createBrotliCompress, createGzip } from "zlib";

const extensions = [".css", ".html", ".js", ".json", ".map", ".svg", ".txt", ".xml"];
function compress(path: string): void {
	if (statSync(path).isDirectory())
		readdirSync(path).forEach((child) => compress(`${path}/${child}`));
	else if (extensions.some((ext) => path.endsWith(ext))) {
		createReadStream(path)
			.pipe(createGzip())
			.pipe(createWriteStream(`${path}.gz`));
		createReadStream(path)
			.pipe(createBrotliCompress())
			.pipe(createWriteStream(`${path}.br`));
	}
}

compress("dist");
