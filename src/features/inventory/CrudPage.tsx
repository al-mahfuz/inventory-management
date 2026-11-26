import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { ActionButton } from "../../shared/ui/ActionButton";
import { Alert } from "../../shared/ui/Alert";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { DataTable } from "../../shared/ui/DataTable";
import type { Column } from "../../shared/ui/DataTable";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ErrorState } from "../../shared/ui/ErrorState";
import { FormField } from "../../shared/ui/FormField";
import { Modal } from "../../shared/ui/Modal";
import { PageHeader } from "../../shared/ui/PageHeader";
import { SelectField } from "../../shared/ui/SelectField";
import type { SelectOption } from "../../shared/ui/SelectField";
import { Skeleton } from "../../shared/ui/Skeleton";
import { useT } from "../../lib/i18n/LocalizationProvider";
import { getActiveLocale } from "../../lib/i18n/dictionary";
import { useRecordMutations, useRecords } from "./hooks";
import type { InventorySchema, SchemaRecord } from "./types";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "checkbox" | "select";
  required?: boolean;
  options?: SelectOption[];
  /** Spans both form columns. */
  wide?: boolean;
};

type FormValues = Record<string, string | boolean>;

function emptyValues(fields: FieldDef[]): FormValues {
  return Object.fromEntries(fields.map((field) => [field.name, field.type === "checkbox" ? true : ""]));
}

function toFormValues(fields: FieldDef[], row: Record<string, unknown>): FormValues {
  return Object.fromEntries(
    fields.map((field) => {
      const value = row[field.name];
      if (field.type === "checkbox") return [field.name, value !== false];
      return [field.name, value === undefined || value === null ? "" : String(value)];
    })
  );
}

function toPayload(fields: FieldDef[], values: FormValues): Record<string, unknown> {
  return Object.fromEntries(
    fields.map((field) => {
      const value = values[field.name];
      if (field.type === "number") return [field.name, value === "" ? 0 : Number(value)];
      if (field.type === "checkbox") return [field.name, Boolean(value)];
      return [field.name, String(value).trim()];
    })
  );
}

export function CrudPage<S extends InventorySchema>({
  columns,
  emptyIcon,
  fields,
  noun,
  nounPlural,
  schema,
  searchKeys,
  subtitle,
  title
}: {
  columns: Column<SchemaRecord<S>>[];
  emptyIcon: ReactNode;
  fields: FieldDef[];
  /** Singular entity name as used mid-sentence, already translated. */
  noun: string;
  /** Plural entity name as used mid-sentence, already translated. */
  nounPlural: string;
  schema: S;
  searchKeys: (keyof SchemaRecord<S> & string)[];
  subtitle: string;
  title: string;
}) {
  const { t } = useT();
  const records = useRecords(schema);
  const mutations = useRecordMutations(schema);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ id?: string; values: FormValues } | null>(null);
  const [deleting, setDeleting] = useState<SchemaRecord<S> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = records.data ?? [];
    if (!term) return all;
    return all.filter((row) => searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(term)));
  }, [records.data, search, searchKeys]);

  const saving = mutations.create.isPending || mutations.update.isPending;

  function openForm(row?: SchemaRecord<S>) {
    setFormError(null);
    setEditing(row ? { id: row.id, values: toFormValues(fields, row as Record<string, unknown>) } : { values: emptyValues(fields) });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setFormError(null);
    const input = toPayload(fields, editing.values);
    try {
      if (editing.id) await mutations.update.mutateAsync({ id: editing.id, input });
      else await mutations.create.mutateAsync(input);
      setEditing(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  }

  const tableColumns: Column<SchemaRecord<S>>[] = [
    ...columns,
    {
      header: "",
      key: "actions",
      render: (row) => (
        <div className="row-actions">
          <ActionButton variant="icon" title={t("crud.edit", { noun })} aria-label={t("crud.edit", { noun })} icon={<Pencil size={16} />} onClick={() => openForm(row)} />
          <ActionButton variant="icon" title={t("crud.delete", { noun })} aria-label={t("crud.delete", { noun })} icon={<Trash2 size={16} />} onClick={() => setDeleting(row)} />
        </div>
      )
    }
  ];

  return (
    <section>
      <PageHeader title={title} subtitle={subtitle} actions={<ActionButton icon={<Plus size={16} />} onClick={() => openForm()}>{t("crud.new", { noun })}</ActionButton>} />

      <div className="toolbar">
        <label className="search-box">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("crud.search", { items: nounPlural })} aria-label={t("crud.search", { items: nounPlural })} />
        </label>
        <span className="muted">{records.data ? t("crud.count", { shown: rows.length.toLocaleString(getActiveLocale()), total: records.data.length.toLocaleString(getActiveLocale()) }) : null}</span>
      </div>

      {mutations.remove.error ? <Alert tone="error">{mutations.remove.error.message}</Alert> : null}

      {records.isLoading ? (
        <div className="panel"><Skeleton className="skeleton-line-lg" /><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line" /></div>
      ) : records.isError ? (
        <ErrorState message={records.error.message} onRetry={() => records.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={search ? t("crud.noMatch", { items: nounPlural, search }) : t("crud.emptyTitle", { items: nounPlural })}
          description={search ? t("crud.tryDifferentSearch") : t("crud.emptyDescription", { noun })}
          action={search ? null : <ActionButton icon={<Plus size={16} />} onClick={() => openForm()}>{t("crud.new", { noun })}</ActionButton>}
        />
      ) : (
        <DataTable columns={tableColumns} rows={rows} />
      )}

      {editing ? (
        <Modal title={editing.id ? t("crud.edit", { noun }) : t("crud.new", { noun })} onClose={() => setEditing(null)}>
          <form className="form-grid" onSubmit={onSubmit}>
            {fields.map((field) => {
              const value = editing.values[field.name];
              const setValue = (next: string | boolean) => setEditing({ ...editing, values: { ...editing.values, [field.name]: next } });
              const style = field.wide ? { gridColumn: "1 / -1" } : undefined;
              if (field.type === "checkbox") {
                return (
                  <label key={field.name} className="check-field" style={style}>
                    <input type="checkbox" checked={Boolean(value)} onChange={(event) => setValue(event.target.checked)} />
                    <span>{field.label}</span>
                  </label>
                );
              }
              if (field.type === "select") {
                return (
                  <div key={field.name} style={style}>
                    <SelectField label={field.label} options={field.options ?? []} placeholder={t("ui.none")} required={field.required} value={String(value)} onChange={(event) => setValue(event.target.value)} />
                  </div>
                );
              }
              return (
                <div key={field.name} style={style}>
                  <FormField
                    label={field.label}
                    type={field.type ?? "text"}
                    required={field.required}
                    min={field.type === "number" ? 0 : undefined}
                    step={field.type === "number" ? "any" : undefined}
                    value={String(value)}
                    onChange={(event) => setValue(event.target.value)}
                  />
                </div>
              );
            })}
            {formError ? <div style={{ gridColumn: "1 / -1" }}><Alert tone="error">{formError}</Alert></div> : null}
            <div className="form-actions">
              <button type="button" className="icon-button" onClick={() => setEditing(null)}>{t("ui.cancel")}</button>
              <button type="submit" className="primary-button" disabled={saving}>{saving ? t("ui.saving") : t("ui.save")}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title={t("crud.delete", { noun })}
          message={t("crud.deleteConfirm", { noun })}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            mutations.remove.mutate(deleting.id);
            setDeleting(null);
          }}
        />
      ) : null}
    </section>
  );
}
