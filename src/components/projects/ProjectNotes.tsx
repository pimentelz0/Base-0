import React, { useState } from "react";
import { Plus, Trash2, Edit3, CheckSquare, Square, Search, X, Check, FileText } from "lucide-react";
import { ProjectNote, NoteColor } from "../../types";

interface ProjectNotesProps {
  notes: ProjectNote[];
  onAddNote: (note: Omit<ProjectNote, "id" | "updatedAt">) => void;
  onUpdateNote: (note: ProjectNote) => void;
  onDeleteNote: (id: string) => void;
  projectName: string;
}

const COLOR_MAP: Record<NoteColor, { bg: string; border: string; badge: string; text: string }> = {
  zinc: {
    bg: "bg-zinc-900",
    border: "border-zinc-800 hover:border-zinc-700",
    badge: "bg-zinc-800 text-zinc-300",
    text: "text-zinc-200",
  },
  blue: {
    bg: "bg-sky-950/40",
    border: "border-sky-800/50 hover:border-sky-600/60",
    badge: "bg-sky-900/50 text-sky-300",
    text: "text-sky-100",
  },
  emerald: {
    bg: "bg-emerald-950/40",
    border: "border-emerald-800/50 hover:border-emerald-600/60",
    badge: "bg-emerald-900/50 text-emerald-300",
    text: "text-emerald-100",
  },
  yellow: {
    bg: "bg-amber-950/40",
    border: "border-amber-800/50 hover:border-amber-600/60",
    badge: "bg-amber-900/50 text-amber-300",
    text: "text-amber-100",
  },
  orange: {
    bg: "bg-orange-950/40",
    border: "border-orange-800/50 hover:border-orange-600/60",
    badge: "bg-orange-900/50 text-orange-300",
    text: "text-orange-100",
  },
  pink: {
    bg: "bg-pink-950/40",
    border: "border-pink-800/50 hover:border-pink-600/60",
    badge: "bg-pink-900/50 text-pink-300",
    text: "text-pink-100",
  },
  purple: {
    bg: "bg-purple-950/40",
    border: "border-purple-800/50 hover:border-purple-600/60",
    badge: "bg-purple-900/50 text-purple-300",
    text: "text-purple-100",
  },
};

export const ProjectNotes: React.FC<ProjectNotesProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  projectName,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState<string>("");
  const [formContent, setFormContent] = useState<string>("");
  const [formColor, setFormColor] = useState<NoteColor>("zinc");
  const [formChecklist, setFormChecklist] = useState<Array<{ id: string; text: string; done: boolean }>>([]);
  const [newChecklistText, setNewChecklistText] = useState<string>("");

  const handleOpenAdd = () => {
    setEditingNote(null);
    setFormTitle("");
    setFormContent("");
    setFormColor("zinc");
    setFormChecklist([]);
    setNewChecklistText("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: ProjectNote) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormColor(note.color || "zinc");
    setFormChecklist(note.checklist || []);
    setNewChecklistText("");
    setIsModalOpen(true);
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setFormChecklist((prev) => [
      ...prev,
      { id: `chk-${Date.now()}-${Math.random()}`, text: newChecklistText.trim(), done: false },
    ]);
    setNewChecklistText("");
  };

  const handleToggleChecklistItem = (itemId: string) => {
    setFormChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item))
    );
  };

  const handleRemoveChecklistItem = (itemId: string) => {
    setFormChecklist((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() && !formContent.trim() && formChecklist.length === 0) return;

    if (editingNote) {
      onUpdateNote({
        ...editingNote,
        title: formTitle.trim() || "Anotação sem título",
        content: formContent.trim(),
        color: formColor,
        checklist: formChecklist,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddNote({
        title: formTitle.trim() || "Anotação do Projeto",
        content: formContent.trim(),
        color: formColor,
        checklist: formChecklist,
      });
    }

    setIsModalOpen(false);
  };

  // Quick toggle in note card
  const handleQuickToggleItem = (note: ProjectNote, itemId: string) => {
    const updatedChecklist = (note.checklist || []).map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    onUpdateNote({
      ...note,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    });
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.checklist && n.checklist.some((item) => item.text.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar: Search & Add Note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar nas anotações do projeto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#007AFF] transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          id="btn-add-project-note"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black font-bold text-sm shadow-md shadow-[#007AFF]/20 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nova Anotação</span>
        </button>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3 stroke-[1.5]" />
          <h3 className="text-base font-bold text-zinc-300 mb-1">
            {searchTerm ? "Nenhuma anotação encontrada" : "Nenhuma anotação neste projeto ainda"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            {searchTerm
              ? "Tente buscar por outras palavras-chave ou limpe a busca."
              : `Crie anotações, listas de verificação, ideias e referências para "${projectName}". O assistente de IA também consultará essas notas.`}
          </p>
          {!searchTerm && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Primeira Anotação</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const style = COLOR_MAP[note.color || "zinc"] || COLOR_MAP.zinc;
            return (
              <div
                key={note.id}
                className={`p-4 rounded-2xl border ${style.bg} ${style.border} transition-all duration-200 flex flex-col justify-between group relative shadow-sm`}
              >
                <div>
                  {/* Note Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-sm text-white leading-snug line-clamp-2">
                      {note.title}
                    </h4>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(note)}
                        title="Editar anotação"
                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Excluir esta anotação do projeto?")) {
                            onDeleteNote(note.id);
                          }
                        }}
                        title="Excluir anotação"
                        className="p-1 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800/80 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Note Content */}
                  {note.content && (
                    <p className={`text-xs ${style.text} whitespace-pre-wrap leading-relaxed mb-3`}>
                      {note.content}
                    </p>
                  )}

                  {/* Checklist if any */}
                  {note.checklist && note.checklist.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-zinc-800/60 mb-2">
                      {note.checklist.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleQuickToggleItem(note, item.id)}
                          className="flex items-start gap-2 text-xs cursor-pointer select-none group/item py-0.5"
                        >
                          {item.done ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-zinc-500 group-hover/item:text-zinc-300 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={
                              item.done
                                ? "line-through text-zinc-500 transition-colors"
                                : "text-zinc-300 transition-colors"
                            }
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer status */}
                <div className="pt-2 mt-2 border-t border-zinc-800/40 flex items-center justify-between text-[10px] text-zinc-500">
                  <span className={`px-2 py-0.5 rounded-md font-mono font-medium ${style.badge}`}>
                    {note.color === "blue"
                      ? "Azul"
                      : note.color === "emerald"
                      ? "Verde"
                      : note.color === "yellow"
                      ? "Amarelo"
                      : note.color === "orange"
                      ? "Laranja"
                      : note.color === "pink"
                      ? "Rosa"
                      : note.color === "purple"
                      ? "Roxo"
                      : "Geral"}
                  </span>
                  {note.checklist && note.checklist.length > 0 && (
                    <span>
                      {note.checklist.filter((c) => c.done).length}/{note.checklist.length} itens
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Note */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white font-['Outfit']">
                {editingNote ? "Editar Anotação" : "Nova Anotação no Projeto"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Note Title */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Título
                </label>
                <input
                  type="text"
                  placeholder="Ex: Escopo da Sprint 1, Ideias de UI, Requisitos..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              {/* Note Color selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Cor do Cartão
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {(["zinc", "blue", "emerald", "yellow", "orange", "pink", "purple"] as NoteColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        c === "zinc"
                          ? "bg-zinc-700 border-zinc-500"
                          : c === "blue"
                          ? "bg-sky-500 border-sky-300"
                          : c === "emerald"
                          ? "bg-emerald-500 border-emerald-300"
                          : c === "yellow"
                          ? "bg-amber-400 border-amber-200"
                          : c === "orange"
                          ? "bg-orange-500 border-orange-300"
                          : c === "pink"
                          ? "bg-pink-500 border-pink-300"
                          : "bg-purple-500 border-purple-300"
                      } ${formColor === c ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-black" : "opacity-80 hover:opacity-100"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Note Content */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Conteúdo / Texto
                </label>
                <textarea
                  rows={4}
                  placeholder="Escreva detalhes, links, instruções ou considerações..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#007AFF] resize-none"
                />
              </div>

              {/* Checklist / Tarefas da nota */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Checklist de Itens (Opcional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Adicionar item à lista..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#007AFF]"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                {formChecklist.length > 0 && (
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {formChecklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-xs"
                      >
                        <div
                          onClick={() => handleToggleChecklistItem(item.id)}
                          className="flex items-center gap-2 cursor-pointer select-none flex-1 truncate"
                        >
                          {item.done ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          )}
                          <span className={item.done ? "line-through text-zinc-500" : "text-zinc-300"}>
                            {item.text}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistItem(item.id)}
                          className="text-zinc-500 hover:text-red-400 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-black transition-all cursor-pointer shadow-md shadow-[#007AFF]/20"
                >
                  {editingNote ? "Salvar Alterações" : "Criar Anotação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
