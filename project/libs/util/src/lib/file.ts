import {
	copyFileSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync
} from 'fs';
import { glob } from 'glob';
import { basename, join } from 'path';

/**
 * Recurse copy all files and folders from a directory to another directory,
 * replacing files and folders with the same name
 *
 * @param fromPath Path to copy from
 * @param toPath Path to copy to
 */
export const copyFolderSync = (fromPath: string, toPath: string): void => {
	if (!existsSync(fromPath)) {
		return;
	}
	if (!existsSync(toPath)) {
		mkdirSync(toPath);
	}
	readdirSync(fromPath).forEach((file) => {
		if (lstatSync(join(fromPath, file)).isFile()) {
			copyFileSync(join(fromPath, file), join(toPath, file));
		} else {
			copyFolderSync(join(fromPath, file), join(toPath, file));
		}
	});
};

/**
 * Find files in provided path
 *
 * @param path Path to search (defaults to `./` when empty)
 * @param shellMatch Optional match files using shell pattern (defaults to `**`)
 * @param relative Optional return files relative to privided path (defaults to `false`)
 *
 * @returns an array of files
 */
export const findFiles = (
	path: string,
	shellMatch = '**',
	relative = false
): string[] => {
	path = path.trim();
	const filePath = `${path ? path : '.'}${
		path.endsWith('/') ? '' : '/'
	}${shellMatch}`;
	return (
		glob
			.sync(filePath)
			// Remove folders
			.filter((file) => statSync(file).isFile())
			.map((file) => (relative ? basename(file, path) : file))
	);
};

/**
 * Find files in provided path with a specific content
 *
 * @param path Path to search (defaults to `./` when empty)
 * @param contentMatch File content to be found
 * @param shellMatch Optional match files using shell pattern (defaults to `**`)
 * @param relative Optional return files relative to privided path (defaults to `false`)
 *
 * @returns an array of files
 */
export const findFilesContent = (
	path: string,
	contentMatch: string,
	shellMatch = '**',
	relative = false
): string[] => {
	return findFiles(path, shellMatch, false)
		.filter((file) =>
			readFileSync(file, { encoding: 'utf-8' }).includes(contentMatch)
		)
		.map((file) => (relative ? basename(file, path) : file));
};
