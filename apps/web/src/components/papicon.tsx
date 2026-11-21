export function Papicon({ name, className = "" }: { name: string; className?: string }) {
  // Papicons are intentionally loaded from their public SVG URLs without adding a package.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={`https://raw.githubusercontent.com/PapillonApp/Papicons/master/icons/${name}.svg`} alt="" aria-hidden="true" />;
}
