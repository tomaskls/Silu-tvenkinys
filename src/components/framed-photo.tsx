import Image from "next/image";

/**
 * Visa nuotrauka be apkarpymo (stačia ar gulsčia) – tuščius kraštus užpildo išblukinta ta pati nuotrauka.
 * Dydį nustato tėvinis elementas: jis turi būti `relative overflow-hidden`.
 */
export function FramedPhoto({ src, alt, sizes, className = "" }: { src: string; alt: string; sizes: string; className?: string }) {
  return (
    <>
      <Image src={src} alt="" aria-hidden fill sizes={sizes} className="scale-110 object-cover opacity-60 blur-xl" />
      <Image src={src} alt={alt} fill sizes={sizes} className={`object-contain ${className}`} />
    </>
  );
}
