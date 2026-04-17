import Image from 'next/image';

interface AllergenBadgeProps {
  code: string;
  nameEs: string;
  icon: string;
}

export default function AllergenBadge({ nameEs, icon }: AllergenBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
      <Image
        src={`/allergen-icons/${icon}`}
        alt={nameEs}
        className="h-3.5 w-3.5"
        width={14}
        height={14}
        loading="lazy"
      />
      <span>{nameEs}</span>
    </span>
  );
}
