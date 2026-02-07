import { Badge } from "./ui/badge";

type Translator = (key: string, options?: Record<string, unknown>) => string;

type LanguageOption = {
  code: string;
  label: string;
};

type AppHeaderProps = {
  t: Translator;
  language: string;
  languageOptions: LanguageOption[];
  onLanguageChange: (language: string) => void;
};

const AppHeader = ({ t, language, languageOptions, onLanguageChange }: AppHeaderProps) => (
  <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("app.tagline")}</p>
      <h1 className="text-3xl font-semibold text-slate-900">{t("app.title")}</h1>
    </div>
    <div className="flex items-center gap-3">
      <Badge>{t("app.status")}</Badge>
      <select
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        value={language}
        onChange={(event) => onLanguageChange(event.target.value)}
      >
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  </header>
);

export default AppHeader;
