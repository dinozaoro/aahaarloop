/** Matches a donation title to a bundled food photo, or null when none fits. */
export function foodPhoto(title: string): string | null {
  const name = title.toLocaleLowerCase("en-IN");
  if (name.includes("biryani")) return "/images/food-biryani.png";
  if (name.includes("idli")) return "/images/food-idli.png";
  if (name.includes("chapati") || name.includes("dal"))
    return "/images/indian-table-current.jpg";
  if (name.includes("fruit")) return "/images/food-fruit-packs.png";
  return null;
}
