import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  Check,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import { NoteItem, NoteColor } from "../types";

interface NotesTabProps {
  notes: NoteItem[];
  onAddNote: (note: Omit<NoteItem, "id">) => void;
  onUpdateNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Color definitions matching the uploaded reference photo adapted to modern dark luxury aesthetic
const COLOR_CONFIGS: Record<
  NoteColor,
  {
    bg: string;
    border: string;
    text: string;
    titleColor: string;
    divider: string;
    trashHover: string;
    chipBg: string;
    label: string;
  }
> = {
  pink: {
    bg: "bg-[#25131e]",
    border: "border-[#f472b6]/40 hover:border-[#f472b6]",
    text: "text-[#fbcfe8]",
    titleColor: "text-[#f472b6]",
    divider: "border-[#f472b6]/20",
    trashHover: "hover:bg-[#f472b6]/20 text-[#f472b6]",
    chipBg: "bg-[#f472b6]/20 text-[#f472b6] border-[#f472b6]/40",
    label: "Rosa",
  },
  emerald: {
    bg: "bg-[#0e2319]",
    border: "border-[#34d399]/40 hover:border-[#34d399]",
    text: "text-[#a7f3d0]",
    titleColor: "text-[#34d399]",
    divider: "border-[#34d399]/20",
    trashHover: "hover:bg-[#34d399]/20 text-[#34d399]",
    chipBg: "bg-[#34d399]/20 text-[#34d399] border-[#34d399]/40",
    label: "Menta / Verde",
  },
  blue: {
    bg: "bg-[#0e1f32]",
    border: "border-[#38bdf8]/40 hover:border-[#38bdf8]",
    text: "text-[#bae6fd]",
    titleColor: "text-[#38bdf8]",
    divider: "border-[#38bdf8]/20",
    trashHover: "hover:bg-[#38bdf8]/20 text-[#38bdf8]",
    chipBg: "bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]/40",
    label: "Azul Céu",
  },
  yellow: {
    bg: "bg-[#241e0e]",
    border: "border-[#fbbf24]/40 hover:border-[#fbbf24]",
    text: "text-[#fef08a]",
    titleColor: "text-[#fbbf24]",
    divider: "border-[#fbbf24]/20",
    trashHover: "hover:bg-[#fbbf24]/20 text-[#fbbf24]",
    chipBg: "bg-[#fbbf24]/20 text-[#fbbf24] border-[#fbbf24]/40",
    label: "Amarelo",
  },
  purple: {
    bg: "bg-[#1c132c]",
    border: "border-[#c084fc]/40 hover:border-[#c084fc]",
    text: "text-[#e9d5ff]",
    titleColor: "text-[#c084fc]",
    divider: "border-[#c084fc]/20",
    trashHover: "hover:bg-[#c084fc]/20 text-[#c084fc]",
    chipBg: "bg-[#c084fc]/20 text-[#c084fc] border-[#c084fc]/40",
    label: "Lavanda",
  },
  orange: {
    bg: "bg-[#27160d]",
    border: "border-[#fb923c]/40 hover:border-[#fb923c]",
    text: "text-[#fed7aa]",
    titleColor: "text-[#fb923c]",
    divider: "border-[#fb923c]/20",
    trashHover: "hover:bg-[#fb923c]/20 text-[#fb923c]",
    chipBg: "bg-[#fb923c]/20 text-[#fb923c] border-[#fb923c]/40",
    label: "Laranja",
  },
  zinc: {
    bg: "bg-[#18181b]",
    border: "border-zinc-700/60 hover:border-zinc-500",
    text: "text-zinc-300",
    titleColor: "text-white",
    divider: "border-zinc-800",
    trashHover: "hover:bg-zinc-800 text-zinc-400",
    chipBg: "bg-zinc-800 text-zinc-300 border-zinc-700",
    label: "Neutro",
  },
};

export const NotesTab: React.FC<NotesTabProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const currentMonthIndex = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  // Delete Confirmation State
  const [noteToDelete, setNoteToDelete] = useState<NoteItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formColor, setFormColor] = useState<NoteColor>("pink");
  const [formDate, setFormDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [checklistItems, setChecklistItems] = useState<
    { id: string; text: string; done: boolean }[]
  >([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const openNewNoteModal = (color: NoteColor = "pink") => {
    setEditingNote(null);
    setFormTitle("");
    setFormContent("");
    setFormColor(color);
    setFormDate(new Date().toISOString().split("T")[0]);
    setChecklistItems([]);
    setNewChecklistText("");
    setIsModalOpen(true);
  };

  const openEditModal = (note: NoteItem) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormColor(note.color || "pink");
    setFormDate(
      note.date
        ? note.date.split("T")[0]
        : new Date().toISOString().split("T")[0]
    );
    setChecklistItems(note.checklist || []);
    setNewChecklistText("");
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() && !formContent.trim() && checklistItems.length === 0)
      return;

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (editingNote) {
      onUpdateNote({
        ...editingNote,
        title: formTitle.trim() || "Sem título",
        content: formContent.trim(),
        color: formColor,
        date: new Date(formDate).toISOString(),
        checklist: checklistItems.length > 0 ? checklistItems : undefined,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddNote({
        title: formTitle.trim() || "Nova Ideia",
        content: formContent.trim(),
        color: formColor,
        date: new Date(formDate).toISOString(),
        checklist: checklistItems.length > 0 ? checklistItems : undefined,
      });
    }
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handlePromptDelete = (note: NoteItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteToDelete(note);
  };

  const handleConfirmDelete = () => {
    if (noteToDelete) {
      onDeleteNote(noteToDelete.id);
      setNoteToDelete(null);
      if (editingNote && editingNote.id === noteToDelete.id) {
        setIsModalOpen(false);
      }
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklistItems((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, text: newChecklistText.trim(), done: false },
    ]);
    setNewChecklistText("");
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const formatDateShort = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `${dd}/${mm}`;
    } catch {
      return "";
    }
  };

  // Filter notes by month and search
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        if (selectedMonth !== "all") {
          try {
            const d = new Date(n.date);
            if (d.getMonth() !== parseInt(selectedMonth, 10)) return false;
          } catch {
            return false;
          }
        }
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase();
          const matchTitle = n.title?.toLowerCase().includes(s);
          const matchContent = n.content?.toLowerCase().includes(s);
          return matchTitle || matchContent;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes, selectedMonth, searchTerm]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-24 relative">
      {/* Top Header */}
      <div className="border-b border-zinc-900 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
          Notas & Ideias
        </h1>
        <p className="text-xs text-zinc-400 mt-1 font-mono">
          Organize suas tarefas, reflexões e conteúdos no mural de notas.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Month Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {MONTH_NAMES.map((month, idx) => {
            const isSelected = selectedMonth === String(idx);
            return (
              <button
                key={month}
                onClick={() => setSelectedMonth((prev) => (prev === String(idx) ? "all" : String(idx)))}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-[#007AFF] text-black shadow-sm"
                    : "bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-900"
                }`}
              >
                {month}
              </button>
            );
          })}
        </div>

        {/* Search */}
        {notes.length > 4 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar em títulos ou conteúdos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:border-[#007AFF] outline-none"
            />
          </div>
        )}
      </div>

      {/* 2-Column Grid matching the requested photo layout */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {filteredNotes.map((note) => {
            const colorCfg =
              COLOR_CONFIGS[note.color] || COLOR_CONFIGS.pink;

            return (
              <div
                key={note.id}
                onClick={() => openEditModal(note)}
                className={`group relative rounded-[22px] p-4 flex flex-col justify-between border transition-all duration-200 cursor-pointer shadow-md hover:-translate-y-1 hover:shadow-xl min-h-[175px] sm:min-h-[195px] ${colorCfg.bg} ${colorCfg.border}`}
              >
                {/* Top Content Area */}
                <div className="flex-1 overflow-hidden pr-0.5">
                  {note.content ? (
                    <p
                      className={`text-xs sm:text-[13px] leading-relaxed line-clamp-5 font-normal select-none break-words ${colorCfg.text}`}
                    >
                      {note.content}
                    </p>
                  ) : (
                    <p
                      className={`text-xs sm:text-[13px] italic opacity-50 select-none ${colorCfg.text}`}
                    >
                      Sem conteúdo.
                    </p>
                  )}

                  {/* Checklist preview snippet */}
                  {note.checklist && note.checklist.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {note.checklist.slice(0, 2).map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-1.5 text-[11px] opacity-75 truncate"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span className={c.done ? "line-through opacity-50" : ""}>
                            {c.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Divider, Title, Date and Trash Button */}
                <div className={`mt-3 pt-2.5 border-t ${colorCfg.divider}`}>
                  <div className="flex items-end justify-between gap-1.5">
                    {/* Title and Date */}
                    <div className="flex-1 min-w-0 pr-1">
                      <h3
                        className={`text-xs sm:text-sm font-black font-['Outfit'] truncate leading-snug ${colorCfg.titleColor}`}
                      >
                        {note.title || "Sem título"}
                      </h3>
                      <div className="text-[10px] sm:text-[11px] font-mono opacity-60 mt-0.5">
                        {formatDateShort(note.date)}
                      </div>
                    </div>

                    {/* Trash / Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => handlePromptDelete(note, e)}
                      className={`p-1.5 rounded-lg transition-all shrink-0 ${colorCfg.trashHover}`}
                      title="Excluir nota"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50">
          <p className="text-sm text-zinc-400 font-mono">
            {selectedMonth === "all"
              ? "Nenhuma nota criada ainda."
              : `Nenhuma nota encontrada para o mês selecionado.`}
          </p>
          <button
            onClick={() => openNewNoteModal("pink")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] text-black text-xs font-black transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Criar Primeira Nota</span>
          </button>
        </div>
      )}

      {/* Floating Action Button "+ Nova Ideia" matching screenshot */}
      <div className="fixed bottom-24 sm:bottom-8 right-6 z-40">
        <button
          onClick={() => openNewNoteModal("pink")}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#007AFF] hover:bg-[#006fe6] text-black font-black shadow-2xl shadow-[#007AFF]/40 active:scale-95 transition-all text-xs sm:text-sm tracking-wide"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nova Ideia</span>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-rose-900/50 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/50 border border-rose-800/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white font-['Outfit']">
                  Excluir Nota
                </h3>
                <p className="text-xs text-zinc-400">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 italic line-clamp-2">
              "{noteToDelete.title || noteToDelete.content || "Sem título"}"
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-colors"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h2 className="text-lg font-black text-white font-['Outfit']">
                {editingNote ? "Editar Nota" : "Nova Ideia"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Color Selector */}
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-400 mb-2">
                  Cor do Card
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "pink",
                      "emerald",
                      "blue",
                      "yellow",
                      "purple",
                      "orange",
                      "zinc",
                    ] as NoteColor[]
                  ).map((color) => {
                    const c = COLOR_CONFIGS[color];
                    const isSelected = formColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormColor(color)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                          c.chipBg
                        } ${
                          isSelected
                            ? "ring-2 ring-white scale-105 shadow-md"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">
                    Título do Card
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rotina noturna / Skincare"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:border-[#007AFF] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#007AFF] outline-none font-mono"
                  />
                </div>
              </div>

              {/* Content Body */}
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">
                  Conteúdo / Descrição
                </label>
                <textarea
                  rows={4}
                  placeholder="Escreva os detalhes, produtos, ideias..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:border-[#007AFF] outline-none leading-relaxed"
                />
              </div>

              {/* Checklist Subitems */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase">
                  Checklist ({checklistItems.length})
                </label>

                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setChecklistItems((prev) =>
                          prev.map((c) =>
                            c.id === item.id ? { ...c, done: !c.done } : c
                          )
                        )
                      }
                      className="text-zinc-400 hover:text-emerald-400"
                    >
                      {item.done ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <span
                      className={`text-xs flex-1 ${
                        item.done
                          ? "line-through text-zinc-500"
                          : "text-zinc-200"
                      }`}
                    >
                      {item.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar item na lista..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#007AFF] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                {editingNote ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNoteToDelete(editingNote);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950 border border-rose-900/50 text-rose-300 text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] disabled:opacity-70 disabled:cursor-not-allowed text-black text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[2.5]" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <span>{editingNote ? "Salvar Alterações" : "Criar Ideia"}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
