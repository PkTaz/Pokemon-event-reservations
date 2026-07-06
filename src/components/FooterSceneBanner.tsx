import Image from "next/image";

export function FooterSceneBanner() {
  return (
    <div className="border-t-4 border-poke-navy bg-[#5a9c4a]">
      <Image
        src="/Pokemonbackgrounf.png"
        alt="King & Cross Tattoo Co. — Pokémon flash event scene"
        width={1916}
        height={821}
        className="block h-auto w-full"
        sizes="100vw"
      />
    </div>
  );
}
