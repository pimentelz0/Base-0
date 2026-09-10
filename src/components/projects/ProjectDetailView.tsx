import React, { useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  CheckSquare,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { ProjectItem, ProjectChatMessage, ProjectNote, ProjectTask } from "../../types";
import { ProjectChat } from "./ProjectChat";
import { ProjectNotes } from "./ProjectNotes";
import { ProjectTasks } from "./ProjectTasks";

interface ProjectDetailViewProps {
  project: ProjectItem;
  onBack: () => void;
  onUpdateProject: (updated: ProjectItem) => void;
  onDeleteProject: (id: string) => void;
}

type ProjectSubTab = "chat" | "notes" | "tasks";

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ProjectSubTab>("chat");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Edit form state
  const [editName, setEditName] = useState<string>(project.name);
  const [editDescription, setEditDescription] = useState<string>(project.description);
  const [editCategory, setEditCategory] = useState<string>(project.category || "Geral");
  const [editStatus, setEditStatus] = useState<"active" | "completed" | "archived">(
    project.status || "active"
  );

  // Chat update handlers
  const handleUpdateMessages = (messages: ProjectChatMessage[]) => {
    onUpdateProject({
      ...project,
      chatMessages: messages,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleClearChat = () => {
    onUpdateProject({
      ...project,
      chatMessages: [],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleNewChat = () => {
    onUpdateProject({
      ...project,
      chatMessages: [],
      updatedAt: new Date().toISOString(),
    });
  };

  // Notes update handlers
  const handleAddNote = (newNote: Omit<ProjectNote, "id" | "updatedAt">) => {
    const noteItem: ProjectNote = {
      ...newNote,
      id: `pnote-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject({
      ...project,
      notes: [noteItem, ...project.notes],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateNote = (updatedNote: ProjectNote) => {
    onUpdateProject({
      ...project,
      notes: project.notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteNote = (id: string) => {
    onUpdateProject({
      ...project,
      notes: project.notes.filter((n) => n.id !== id),
      updatedAt: new Date().toISOString(),
    });
  };

  // Tasks update handlers
  const handleAddTask = (text: string) => {
    const newTask: ProjectTask = {
      id: `ptask-${Date.now()}`,
      text,
      completed: false,
    };
    onUpdateProject({
      ...project,
      tasks: [...(project.tasks || []), newTask],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleTask = (id: string) => {
    const updatedTasks = (project.tasks || []).map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    onUpdateProject({
      ...project,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteTask = (id: string) => {
    onUpdateProject({
      ...project,
      tasks: (project.tasks || []).filter((t) => t.id !== id),
      updatedAt: new Date().toISOString(),
    });
  };

  // Save edit modal
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    onUpdateProject({
      ...project,
      name: editName.trim(),
      description: editDescription.trim(),
      category: editCategory.trim(),
      status: editStatus,
      updatedAt: new Date().toISOString(),
    });
    setIsEditModalOpen(false);
  };

  const completedTasksCount = (project.tasks || []).filter((t) => t.completed).length;
  const totalTasksCount = (project.tasks || []).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold border border-zinc-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Projetos</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditName(project.name);
              setEditDescription(project.description);
              setEditCategory(project.category || "Geral");
              setEditStatus(project.status || "active");
              setIsEditModalOpen(true);
            }}
            title="Editar informações do projeto"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  `Tem certeza que deseja excluir o projeto "${project.name}" e todos os seus chats e anotações?`
                )
              ) {
                onDeleteProject(project.id);
                onBack();
              }
            }}
            title="Excluir este projeto"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#007AFF]/15 text-[#007AFF] text-xs font-mono font-bold border border-[#007AFF]/25">
                {project.category || "Geral"}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                  project.status === "completed"
                    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {project.status === "completed" ? "Concluído" : "Em Andamento"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight pt-1">
              {project.name}
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 shrink-0">
            <div className="text-right">
              <div className="text-white font-bold text-sm">
                {project.chatMessages ? project.chatMessages.length : 0}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Mensagens IA</div>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="text-right">
              <div className="text-white font-bold text-sm">{project.notes.length}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Anotações</div>
            </div>
          </div>
        </div>

        {/* Project Description (used as AI grounding context) */}
        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/80 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-[#007AFF]" />
              Contexto do Projeto & Instrução da IA
            </span>
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="text-zinc-500 hover:text-white flex items-center gap-1 text-[11px] font-normal cursor-pointer"
            >
              {isDescriptionExpanded ? (
                <>
                  <span>Recolher</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Expandir</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <p
            className={`text-xs text-zinc-300 leading-relaxed ${
              isDescriptionExpanded ? "" : "line-clamp-2"
            }`}
          >
            {project.description || "Sem descrição informada para este projeto."}
          </p>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 overflow-x-auto">
          <button
            id="subtab-project-chat"
            onClick={() => setActiveSubTab("chat")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer select-none whitespace-nowrap ${
              activeSubTab === "chat"
                ? "bg-[#007AFF] text-black shadow-md shadow-[#007AFF]/20"
                : "bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Assistente de Projeto</span>
            {project.chatMessages.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeSubTab === "chat" ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {project.chatMessages.length}
              </span>
            )}
          </button>

          <button
            id="subtab-project-notes"
            onClick={() => setActiveSubTab("notes")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer select-none whitespace-nowrap ${
              activeSubTab === "notes"
                ? "bg-[#007AFF] text-black shadow-md shadow-[#007AFF]/20"
                : "bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Anotações</span>
            {project.notes.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeSubTab === "notes" ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {project.notes.length}
              </span>
            )}
          </button>

          <button
            id="subtab-project-tasks"
            onClick={() => setActiveSubTab("tasks")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer select-none whitespace-nowrap ${
              activeSubTab === "tasks"
                ? "bg-[#007AFF] text-black shadow-md shadow-[#007AFF]/20"
                : "bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Metas & Tarefas</span>
            {totalTasksCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeSubTab === "tasks" ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {completedTasksCount}/{totalTasksCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SubTab Views */}
      <div>
        {activeSubTab === "chat" && (
          <ProjectChat
            projectName={project.name}
            projectDescription={project.description}
            notes={project.notes}
            tasks={project.tasks}
            messages={project.chatMessages}
            onUpdateMessages={handleUpdateMessages}
            onClearChat={handleClearChat}
            onNewChat={handleNewChat}
          />
        )}

        {activeSubTab === "notes" && (
          <ProjectNotes
            notes={project.notes}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            projectName={project.name}
          />
        )}

        {activeSubTab === "tasks" && (
          <ProjectTasks
            tasks={project.tasks || []}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            projectName={project.name}
          />
        )}
      </div>

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 shrink-0">
              <h3 className="text-base font-black text-zinc-900 dark:text-white font-['Outfit']">
                Editar Projeto
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 flex flex-col min-h-0 flex-1 overflow-hidden">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1 py-1">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#007AFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Ex: Tecnologia, Negócios, Pessoal, Estudos..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#007AFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#007AFF]"
                  >
                    <option value="active">Em Andamento</option>
                    <option value="completed">Concluído</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Descrição & Diretrizes para a IA
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#007AFF] resize-y min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-black transition-all cursor-pointer shadow-md shadow-[#007AFF]/20"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
