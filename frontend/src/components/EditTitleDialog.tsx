import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "./ui/dialog";
import { Input } from "./ui/input";

type Translator = (key: string, options?: Record<string, unknown>) => string;

type EditTitleDialogProps = {
  t: Translator;
  open: boolean;
  titleValue: string;
  showRevert: boolean;
  onTitleChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onRevert: () => void;
};

const EditTitleDialog = ({
  t,
  open,
  titleValue,
  showRevert,
  onTitleChange,
  onSave,
  onCancel,
  onRevert
}: EditTitleDialogProps) => (
  <Dialog
    open={open}
    onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        onCancel();
      }
    }}
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("results.editTitle")}</DialogTitle>
        <DialogDescription>{t("results.editHint")}</DialogDescription>
      </DialogHeader>
      <label className="mt-4 grid gap-2 text-sm">
        <span className="text-slate-600">{t("results.titleLabel")}</span>
        <Input value={titleValue} onChange={(event) => onTitleChange(event.target.value)} />
      </label>
      <DialogFooter>
        {showRevert ? (
          <Button variant="outline" onClick={onRevert}>
            {t("results.revert")}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onCancel}>
          {t("results.cancel")}
        </Button>
        <Button onClick={onSave}>{t("results.save")}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default EditTitleDialog;
