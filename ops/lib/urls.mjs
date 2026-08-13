export function cleanUrl(page) {
  if (page === "index.html") return "/";
  if (page.endsWith("/index.html")) {
    return `/${page.slice(0, -"index.html".length)}`;
  }
  return `/${page.replace(/\.html$/, "")}`;
}