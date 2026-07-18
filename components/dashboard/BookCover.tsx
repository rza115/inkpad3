// Cover generatif berbasis id project — belum ada kolom cover_url/warna di DB,
// jadi setiap project dapat "plate" yang deterministik (hash id) dan konsisten
// di setiap render, bukan random. Semua warna dari token @theme (globals.css),
// tidak hardcode di luar palet InkPad.

const PLATES = [
  { base: "#6b2737", shape: "#8a3a4c" }, // wine
  { base: "#1e1b16", shape: "#3a352c" }, // ink
  { base: "#4a5568", shape: "#616f87" }, // slate
  { base: "#5c4a1f", shape: "#b8934a" }, // brass (gelap ke terang)
] as const;

function hashId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function BookCover({ id }: { id: string }) {
  const hash = hashId(id);
  const plate = PLATES[hash % PLATES.length];
  const variant = hash % 3;

  return (
    <svg
      viewBox="0 0 200 300"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <rect width="200" height="300" fill={plate.base} />
      {variant === 0 && (
        <circle cx="150" cy="55" r="70" fill={plate.shape} opacity="0.55" />
      )}
      {variant === 1 && (
        <path
          d="M0 210 Q60 170 120 210 T200 200 V300 H0 Z"
          fill={plate.shape}
          opacity="0.55"
        />
      )}
      {variant === 2 && (
        <path
          d="M0 0 L200 0 L200 110 L100 160 L0 110 Z"
          fill={plate.shape}
          opacity="0.55"
        />
      )}
    </svg>
  );
}
