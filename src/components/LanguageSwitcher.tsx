import { useTranslation } from "react-i18next";
import { languages } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function Flag({ countryCode, className = "" }: { countryCode: string; className?: string }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${countryCode}.png`}
      alt={countryCode.toUpperCase()}
      className={`inline-block rounded-sm ${className}`}
      style={{ width: 20, height: 14, objectFit: 'cover' }}
    />
  );
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = languages.find((l) => l.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 px-2">
          <Flag countryCode={current.countryCode} />
          <span className="uppercase text-[10px] font-semibold">{current.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`gap-2 ${lang.code === i18n.language ? "bg-accent font-semibold" : ""}`}
          >
            <Flag countryCode={lang.countryCode} />
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
