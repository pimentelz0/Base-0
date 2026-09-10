import React, { useState, useEffect } from "react";
import {
  FolderKanban,
  Plus,
  Search,
  X,
  Sparkles,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  CheckSquare,
  Flame,
} from "lucide-react";
import { ProjectItem } from "../../types";
import { StorageService } from "../../utils/storage";
import { ProjectDetailView } from "./ProjectDetailView";

interface ProjectsTabProps {
  initialProjectId?: string | null;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({ initialProjectId }) => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId || null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // New Project Form
  const [newName, setNewName] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("Geral");

  useEffect(() => {
    const loaded = StorageService.getProjects();
    setProjects(loaded);
  }, []);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDescription.trim()) return;

    const newProject: ProjectItem = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newName.trim(),
      description: newDescription.trim(),
      category: newCategory.trim() || "Geral",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: [],
      chatMessages: [],
      tasks: [],
    };

    const updatedList = [newProject, ...projects];
    setProjects(updatedList);
    StorageService.saveProjects(updatedList);

    // Reset and select newly created project immediately
    setNewName("");
    setNewDescription("");
    setNewCategory("Geral");
    setIsCreateModalOpen(false);
    setSelectedProjectId(newProject.id);
  };

  const handleUpdateProject = (updated: ProjectItem) => {
    const updatedList = projects.map((p) => (p.id === updated.id ? updated : p));
    setProjects(updatedList);
    StorageService.saveProjects(updatedList);
  };

  const handleDeleteProject = (id: string) => {
    const updatedList = projects.filter((p) => p.id !== id);
    setProjects(updatedList);
    StorageService.saveProjects(updatedList);
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
  };

  // If a project is currently open
  if (selectedProjectId) {
    const selected = projects.find((p) => p.id === selectedProjectId);
    if (selected) {
      return (
        <ProjectDetailView
          project={selected}
          onBack={() => setSelectedProjectId(null)}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
        />
      );
    }
  }

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.status !== "completed") ||
      (statusFilter === "completed" && p.status === "completed");

    return matchesSearch && matchesStatus;
  });

  const activeCount = projects.filter((p) => p.status !== "completed").length;
  const completedCount = projects.filter((p) => p.status === "completed").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#007AFF]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-ping" />
              <span className="text-[11px] font-mono font-bold tracking-widest text-[#007AFF] uppercase">
                Módulo de Projetos Base 0
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
              Seus Projetos & Iniciativas
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Crie projetos com copiloto de inteligência artificial dedicado, chat persistente multimodal (áudio e fotos) e bloco de anotações individual.
            </p>
          </div>

          <button
            id="btn-open-create-project-modal"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#007AFF] hover:bg-[#006fe6] text-black font-black text-sm shadow-lg shadow-[#007AFF]/25 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>Adicionar Projeto</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-zinc-800/80">
          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
              Total de Projetos
            </div>
            <div className="text-xl font-black text-white mt-0.5">{projects.length}</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
              Em Andamento
            </div>
            <div className="text-xl font-black text-[#007AFF] mt-0.5">{activeCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
              Concluídos
            </div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{completedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar projetos por título, descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#007AFF] transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-[#007AFF] text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Todos ({projects.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "active"
                ? "bg-[#007AFF] text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Ativos ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "completed"
                ? "bg-[#007AFF] text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Concluídos ({completedCount})
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#007AFF] mx-auto shadow-xl">
            <FolderKanban className="w-8 h-8 stroke-[1.8]" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-black text-white font-['Outfit']">
              {searchTerm ? "Nenhum projeto encontrado" : "Nenhum projeto cadastrado"}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {searchTerm
                ? "Tente buscar com outros termos ou altere o filtro de status."
                : "Adicione seu primeiro projeto. Defina o nome e a descrição para que o assistente de IA aprenda o objetivo e ajude você a realizá-lo."}
            </p>
          </div>

          {!searchTerm && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black font-black text-xs shadow-md shadow-[#007AFF]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Criar Primeiro Projeto</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => {
            const completedTasks = (proj.tasks || []).filter((t) => t.completed).length;
            const totalTasks = (proj.tasks || []).length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className="p-5 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/90 hover:border-[#007AFF]/60 transition-all duration-200 flex flex-col justify-between group cursor-pointer shadow-lg hover:shadow-[#007AFF]/10 hover:-translate-y-0.5 relative"
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#007AFF]/15 text-[#007AFF] text-[11px] font-mono font-bold border border-[#007AFF]/20">
                      {proj.category || "Geral"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        proj.status === "completed"
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {proj.status === "completed" ? "Concluído" : "Ativo"}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-black text-base text-white group-hover:text-[#007AFF] transition-colors leading-snug line-clamp-1 mb-1.5 font-['Outfit']">
                    {proj.name}
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-4">
                    {proj.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-zinc-800/70">
                  {/* Tasks progress bar if any */}
                  {totalTasks > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                        <span>Metas ({completedTasks}/{totalTasks})</span>
                        <span className="text-white font-bold">{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#007AFF] to-emerald-400 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Indicators and Enter button */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1" title="Mensagens de IA">
                        <Sparkles className="w-3.5 h-3.5 text-[#007AFF]" />
                        <span>{proj.chatMessages?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Anotações">
                        <FileText className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{proj.notes?.length || 0}</span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#007AFF] group-hover:translate-x-1 transition-transform">
                      <span>Abrir</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-4 my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#007AFF]/20 border border-[#007AFF]/30 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4 text-[#007AFF]" />
                </div>
                <h3 className="text-base font-black text-zinc-900 dark:text-white font-['Outfit']">
                  Novo Projeto
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 flex flex-col min-h-0 flex-1 overflow-hidden">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1 py-1">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Nome do Projeto <span className="text-[#007AFF]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lançamento de SaaS, Reforma, Estudo de Francês..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-[#007AFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Categoria ou Área
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Tecnologia, Negócios, Estudos, Pessoal, Fitness..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-[#007AFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Descrição Detalhada do Projeto <span className="text-[#007AFF]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Explique o propósito, público-alvo, metas principais, tecnologias ou desafios deste projeto. O assistente de inteligência artificial usará essa descrição para te auxiliar em todas as conversas!"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-[#007AFF] resize-y min-h-[100px] leading-relaxed"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    💡 Quanto mais detalhes você colocar aqui, mais inteligente e personalizada será a conversa com a IA.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim() || !newDescription.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] disabled:opacity-50 text-black text-xs font-black transition-all cursor-pointer shadow-lg shadow-[#007AFF]/25 active:scale-95"
                >
                  Criar e Acessar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
