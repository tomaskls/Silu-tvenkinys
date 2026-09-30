import Image from "next/image";

type Props = {
  eyebrow?: string;
  title: string;
  intro?: string;
  image?: string;
};

export function PageHeader({ eyebrow, title, intro, image = "/images/sektorius-9.jpg" }: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-pine-900">
      <Image src={image} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-35" />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-pine-950/80 to-pine-900/30" />
      <div className="container-page py-16 sm:py-24">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-widest text-wood-400">{eyebrow}</p>}
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold text-white sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-pine-100">{intro}</p>}
      </div>
    </section>
  );
}
