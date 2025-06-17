import fs from "fs";
import path from "path";

type LinksMap = {
  [id: string]: { [key: string]: string };
};

// prettier-ignore
// Append or create a JSON file with the links object
export const saveLinksToJson = async (filePath: string, id: string, links: string[]) => {
  let allLinks: LinksMap = {};

  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });


  // Try to read existing file first
  if (fs.existsSync(filePath)) {
    const data = await fs.promises.readFile(filePath, "utf-8");

    if (data.trim()) {
      try {
        allLinks = JSON.parse(data);
      } catch (err) {
        console.error("Error parsing JSON file, starting fresh.", err);
        allLinks = {};
      }
    }
  }

  // Remove duplicate links
  const uniqueLinks = Array.from(new Set(links));


  // Format links into object like { link1: "url", link2: "url", ... }
  const linksObject: { [key: string]: string } = {};
  uniqueLinks.forEach((link, index) => {
    linksObject[`link${index + 1}`] = link;
  });

  // Merge or add the current id's links without overwriting entire object
  allLinks[id] = linksObject;

  // Write back to the file
  const tempPath = `${filePath}.tmp`;
  await fs.promises.writeFile(tempPath, JSON.stringify(allLinks, null, 2), "utf-8");
  await fs.promises.rename(tempPath, filePath);
};
