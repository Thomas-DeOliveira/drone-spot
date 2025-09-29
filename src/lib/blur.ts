export function toBase64(str: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(str).toString("base64");
  }
  // eslint-disable-next-line no-undef
  return btoa(str);
}

export function shimmerSVG(width: number, height: number): string {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#f3f4f6" offset="20%" />
        <stop stop-color="#e5e7eb" offset="50%" />
        <stop stop-color="#f3f4f6" offset="70%" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="#f3f4f6" />
    <rect id="r" width="${width}" height="${height}" fill="url(#g)" />
    <animate xlink:href="#r" attributeName="x" from="-${width}" to="${width}" dur="1s" repeatCount="indefinite"  />
  </svg>`;
}

export function shimmerDataURL(width: number, height: number): string {
  return `data:image/svg+xml;base64,${toBase64(shimmerSVG(width, height))}`;
}


