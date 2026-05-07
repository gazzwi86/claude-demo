function slugify(str) {
  if (typeof str !== "string") return "";
  return str
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function uniqueSlug(base, exists) {
  const root = slugify(base) || "item";
  let candidate = root;
  let n = 2;
  while (exists(candidate)) {
    candidate = `${root}-${n++}`;
  }
  return candidate;
}

module.exports = { slugify, uniqueSlug };
