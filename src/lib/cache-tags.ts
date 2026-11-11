// Etiquetas do cache das páginas públicas. O painel invalida a etiqueta do que
// foi salvo (updateTag), e as páginas que usam aqueles dados se atualizam.
export const cacheTags = {
  catalog: "catalog",
  settings: "settings",
  testimonials: "testimonials",
} as const;
