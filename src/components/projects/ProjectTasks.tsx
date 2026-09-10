import React, { useState } from "react";
import { Plus, CheckSquare, Square, Trash2, CheckCircle2, ListTodo } from "lucide-react";
import { ProjectTask } from "../../types";

interface ProjectTasksProps {
  tasks: ProjectTask[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  projectName: string;
}

export const ProjectTasks: React.FC<ProjectTasksProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  projectName,
}) => {
  const [newTaskText, setNewTaskText] = useState<string>("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(newTaskText.trim());
    setNewTaskText("");
  };

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#007AFF]" />
            <h3 className="font-black text-white text-base">Progresso das Metas</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {completed} de {total} tarefas concluídas ({progressPercent}%)
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full sm:w-64 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-zinc-400">
            <span>Andamento</span>
            <span className="text-white font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#007AFF] to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder={`Adicionar nova meta ou tarefa para "${projectName}"...`}
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#007AFF] transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-[#007AFF]/20"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Adicionar</span>
        </button>
      </form>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40">
          <ListTodo className="w-10 h-10 text-zinc-600 mx-auto mb-2 stroke-[1.5]" />
          <h4 className="text-sm font-bold text-zinc-300 mb-1">Nenhuma meta adicionada</h4>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Divida seu projeto em etapas claras e marque conforme for concluindo.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                task.completed
                  ? "bg-zinc-950/40 border-zinc-900 opacity-60"
                  : "bg-zinc-900/90 border-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              <div
                onClick={() => onToggleTask(task.id)}
                className="flex items-center gap-3 flex-1 cursor-pointer select-none"
              >
                {task.completed ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-500 hover:text-zinc-300 shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    task.completed ? "line-through text-zinc-500" : "text-zinc-200"
                  }`}
                >
                  {task.text}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onDeleteTask(task.id)}
                className="text-zinc-500 hover:text-red-400 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Excluir tarefa"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
