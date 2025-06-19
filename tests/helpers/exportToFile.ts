import fs from "fs";
import path from "path";

// prettier-ignore
// Append or create a JSON file with the links object
export const saveLinksToJson = async <T>(filePath: string,idOrData: string | { [id: string]: { [key: string]: T } },links?: T[]) => {
  let allLinks: { [id: string]: { [key: string]: T } } = {};

  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

  if (fs.existsSync(filePath)) {
    const data = await fs.promises.readFile(filePath, "utf-8");
    if (data.trim()) {
      try {
        allLinks = JSON.parse(data);
      } catch {
        allLinks = {};
      }
    }
  }
  // If the caller passed a full object (like validatedLinks.json writing)
  if (typeof idOrData === "object" && idOrData !== null && !Array.isArray(idOrData)) {
    for (const [id, newLinks] of Object.entries(idOrData)) {
      const existingGroup = allLinks[id] || {};
      allLinks[id] = { ...existingGroup, ...newLinks };
    }
  } else {
    const id = idOrData as string;
    const existing = allLinks[id] || {};
    const merged = { ...existing };

    const existingValues = new Set(Object.values(merged));

    links?.forEach((link) => {
      if (!existingValues.has(link)) {
        const index = Object.keys(merged).length + 1;
        merged[`link${index}`] = link;
      }
    });

    allLinks[id] = merged;
  }

  // Write back to the file
  const tempPath = `${filePath}.tmp`;
  await fs.promises.writeFile(tempPath, JSON.stringify(allLinks, null, 2), "utf-8");
  await fs.promises.rename(tempPath, filePath);
};
