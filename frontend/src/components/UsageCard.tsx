import { Card } from "./ui/card";

type Translator = (key: string, options?: Record<string, unknown>) => string;

type UsageCardProps = {
  t: Translator;
};

const UsageCard = ({ t }: UsageCardProps) => (
  <Card className="bg-white/80">
    <h3 className="text-base font-semibold text-slate-900">{t("usage.title")}</h3>
    <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600">
      <li>{t("usage.step1")}</li>
      <li>{t("usage.step2")}</li>
      <li>{t("usage.step3")}</li>
      <li>{t("usage.step4")}</li>
      <li>{t("usage.step5")}</li>
      <li>{t("usage.step6")}</li>
    </ol>
  </Card>
);

export default UsageCard;
