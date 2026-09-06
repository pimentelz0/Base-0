import React, { useState, useRef, useEffect } from "react";
import { X, Camera, Upload, Sparkles, Utensils, Check, AlertCircle, Plus, Trash2, Loader2, MessageSquare } from "lucide-react";
import { MealLog, MealCategory, MealItem, UserProfile } from "../types";
import { compressImage } from "../utils/imageCompressor";
import { GulinhaService } from "../services/gulinhaService";

interface MealAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: Omit<MealLog, "id">) => void;
  profile: UserProfile;
  initialDate?: string;
  initialMode?: "manual" | "photo" | "text";
}

export const MealAnalysisModal: React.FC<MealAnalysisModalProps> = ({
  isOpen,
  onClose,
  onSaveMeal,
  profile,
  initialDate,
  initialMode = "manual",
}) => {
  const [activeMode, setActiveMode] = useState<"photo" | "text" | "manual">(initialMode);
  const [mealDate, setMealDate] = useState<string>(() => initialDate || new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (isOpen) {
      if (initialDate) setMealDate(initialDate);
      if (initialMode) setActiveMode(initialMode);
    }
  }, [initialDate, initialMode, isOpen]);

  // Manual mode state
  const [manualTitle, setManualTitle] = useState<string>("Almoço");
  const [manualCategory, setManualCategory] = useState<MealCategory>("lunch");
  const [manualTime, setManualTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [manualCalories, setManualCalories] = useState<string>("500");
  const [manualProtein, setManualProtein] = useState<string>("35");
  const [manualCarbs, setManualCarbs] = useState<string>("50");
  const [manualFat, setManualFat] = useState<string>("15");
  const [manualItems, setManualItems] = useState<Array<{ name: string; portion: string }>>([
    { name: "", portion: "" },
  ]);
  const [manualNotes, setManualNotes] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [descriptionText, setDescriptionText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Analysis result state (editable before confirming)
  const [analyzedMeal, setAnalyzedMeal] = useState<{
    mealName: string;
    mealType: MealCategory;
    items: MealItem[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    gulinhaFeedback: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMimeType("image/jpeg");
    try {
      const compressedDataUrl = await compressImage(file, {
        maxWidth: 640,
        maxHeight: 640,
        quality: 0.72,
        mimeType: "image/jpeg",
      });
      setImagePreview(compressedDataUrl);
    } catch (err) {
      console.warn("Meal photo compression failed, reading directly:", err);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview && !descriptionText.trim()) {
      setAnalysisError("Envie uma foto do prato ou escreva o que comeu.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const data = await GulinhaService.analyzeMeal({
        imageBase64: imagePreview || undefined,
        mimeType: imageMimeType,
        description: descriptionText.trim() || undefined,
        userGoal: profile.goal,
        targetCalories: profile.currentWeight ? Math.round(profile.currentWeight * 30) : 2000,
      });

      // Normalize category
      let cat: MealCategory = "lunch";
      const mt = (data.mealType || "").toLowerCase();
      if (mt.includes("café") || mt.includes("manha")) cat = "breakfast";
      else if (mt.includes("jantar") || mt.includes("noite")) cat = "dinner";
      else if (mt.includes("lanche")) cat = "snack";
      else if (mt.includes("pré") || mt.includes("pre")) cat = "pre_workout";
      else if (mt.includes("pós") || mt.includes("pos")) cat = "post_workout";

      const itemsWithIds: MealItem[] = (data.items || []).map((it: any, idx: number) => ({
        id: `item-${Date.now()}-${idx}`,
        name: it.name || "Alimento",
        portion: it.portion || "1 porção",
        calories: Number(it.calories) || 0,
        protein: Number(it.protein) || 0,
        carbs: Number(it.carbs) || 0,
        fat: Number(it.fat) || 0,
      }));

      setAnalyzedMeal({
        mealName: data.mealName || "Refeição Registrada",
        mealType: cat,
        items: itemsWithIds,
        totalCalories: Number(data.totalCalories) || itemsWithIds.reduce((a, b) => a + b.calories, 0),
        totalProtein: Number(data.totalProtein) || itemsWithIds.reduce((a, b) => a + b.protein, 0),
        totalCarbs: Number(data.totalCarbs) || itemsWithIds.reduce((a, b) => a + b.carbs, 0),
        totalFat: Number(data.totalFat) || itemsWithIds.reduce((a, b) => a + b.fat, 0),
        gulinhaFeedback: data.gulinhaFeedback || "Refeição devidamente contabilizada.",
      });
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err?.message || "Erro de conexão com o servidor. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!analyzedMeal) return;

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    onSaveMeal({
      date: mealDate || now.toISOString().split("T")[0],
      time: timeStr,
      title: analyzedMeal.mealName,
      category: analyzedMeal.mealType,
      items: analyzedMeal.items,
      totalCalories: analyzedMeal.totalCalories,
      totalProtein: analyzedMeal.totalProtein,
      totalCarbs: analyzedMeal.totalCarbs,
      totalFat: analyzedMeal.totalFat,
      photoUrl: imagePreview || undefined,
      gulinhaFeedback: analyzedMeal.gulinhaFeedback,
    });

    setIsSaving(false);
    handleReset();
    onClose();
  };

  const handleSaveManualMeal = async () => {
    if (!manualTitle.trim()) {
      setAnalysisError("Por favor, digite o nome da refeição.");
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const validItems: MealItem[] = manualItems
      .filter((it) => it.name.trim().length > 0)
      .map((it, idx) => ({
        id: `m-item-${Date.now()}-${idx}`,
        name: it.name.trim(),
        portion: it.portion.trim() || "1 porção",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      }));

    const finalCalories = Math.max(0, Number(manualCalories) || 0);
    const finalProtein = Math.max(0, Number(manualProtein) || 0);
    const finalCarbs = Math.max(0, Number(manualCarbs) || 0);
    const finalFat = Math.max(0, Number(manualFat) || 0);

    onSaveMeal({
      date: mealDate || new Date().toISOString().split("T")[0],
      time: manualTime || `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`,
      title: manualTitle.trim(),
      category: manualCategory,
      items: validItems.length > 0 ? validItems : [
        {
          id: `item-${Date.now()}`,
          name: manualTitle.trim(),
          portion: "1 porção",
          calories: finalCalories,
          protein: finalProtein,
          carbs: finalCarbs,
          fat: finalFat,
        }
      ],
      totalCalories: finalCalories,
      totalProtein: finalProtein,
      totalCarbs: finalCarbs,
      totalFat: finalFat,
      gulinhaFeedback: manualNotes.trim() || "Refeição registrada manualmente.",
    });

    setIsSaving(false);
    handleReset();
    onClose();
  };

  const handleAddManualItem = () => {
    setManualItems([...manualItems, { name: "", portion: "" }]);
  };

  const handleRemoveManualItem = (index: number) => {
    setManualItems(manualItems.filter((_, i) => i !== index));
  };

  const handleUpdateManualItem = (index: number, field: "name" | "portion", value: string) => {
    const updated = [...manualItems];
    updated[index][field] = value;
    setManualItems(updated);
  };

  const handleReset = () => {
    setImagePreview(null);
    setDescriptionText("");
    setAnalyzedMeal(null);
    setAnalysisError(null);
  };

  const updateItem = (index: number, field: keyof MealItem, val: any) => {
    if (!analyzedMeal) return;
    const newItems = [...analyzedMeal.items];
    newItems[index] = { ...newItems[index], [field]: val };
    
    // Recalculate totals
    const totalCalories = newItems.reduce((a, b) => a + Number(b.calories || 0), 0);
    const totalProtein = newItems.reduce((a, b) => a + Number(b.protein || 0), 0);
    const totalCarbs = newItems.reduce((a, b) => a + Number(b.carbs || 0), 0);
    const totalFat = newItems.reduce((a, b) => a + Number(b.fat || 0), 0);

    setAnalyzedMeal({
      ...analyzedMeal,
      items: newItems,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
    });
  };

  const deleteItem = (index: number) => {
    if (!analyzedMeal) return;
    const newItems = analyzedMeal.items.filter((_, i) => i !== index);
    const totalCalories = newItems.reduce((a, b) => a + Number(b.calories || 0), 0);
    const totalProtein = newItems.reduce((a, b) => a + Number(b.protein || 0), 0);
    const totalCarbs = newItems.reduce((a, b) => a + Number(b.carbs || 0), 0);
    const totalFat = newItems.reduce((a, b) => a + Number(b.fat || 0), 0);

    setAnalyzedMeal({
      ...analyzedMeal,
      items: newItems,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-900 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/25">
              <Utensils className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-['Outfit',sans-serif]">
                Registrar Refeição
              </h2>
              <p className="text-[11px] text-zinc-400">
                Adicione manualmente ou utilize a IA do Gulinha
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {!analyzedMeal ? (
            <>
              {/* Input Mode Selector - 3 Modes */}
              <div className="grid grid-cols-3 gap-2 bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveMode("manual")}
                  className={`py-2 px-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMode === "manual"
                      ? "bg-[#007AFF] text-black shadow-md shadow-[#007AFF]/25"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Manual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode("photo")}
                  className={`py-2 px-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMode === "photo"
                      ? "bg-[#007AFF] text-black shadow-md shadow-[#007AFF]/25"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Foto (IA)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode("text")}
                  className={`py-2 px-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMode === "text"
                      ? "bg-[#007AFF] text-black shadow-md shadow-[#007AFF]/25"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Texto (IA)</span>
                </button>
              </div>

              {/* Modo Manual - Registro Direto */}
              {activeMode === "manual" && (
                <div className="space-y-4">
                  {/* Nome e Categoria */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                        Nome da Refeição
                      </label>
                      <input
                        type="text"
                        required
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="Ex: Almoço, Omelete Proteico, Shake..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-bold focus:outline-none focus:border-[#007AFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                        Momento do Dia
                      </label>
                      <select
                        value={manualCategory}
                        onChange={(e) => setManualCategory(e.target.value as MealCategory)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-bold focus:outline-none focus:border-[#007AFF]"
                      >
                        <option value="breakfast">Café da Manhã</option>
                        <option value="lunch">Almoço</option>
                        <option value="snack">Lanche</option>
                        <option value="dinner">Jantar</option>
                        <option value="pre_workout">Pré-Treino</option>
                        <option value="post_workout">Pós-Treino</option>
                      </select>
                    </div>
                  </div>

                  {/* Data e Horário */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                        Data
                      </label>
                      <input
                        type="date"
                        value={mealDate}
                        onChange={(e) => setMealDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-bold focus:outline-none focus:border-[#007AFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                        Horário
                      </label>
                      <input
                        type="time"
                        value={manualTime}
                        onChange={(e) => setManualTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-bold focus:outline-none focus:border-[#007AFF]"
                      />
                    </div>
                  </div>

                  {/* Macronutrientes Principais */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
                      Informações Nutricionais (Estimadas ou Totais)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-xl bg-zinc-900 border border-[#007AFF]/40">
                        <span className="text-[10px] uppercase font-black tracking-wider text-[#007AFF] block">
                          Calorias (kcal)
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={manualCalories}
                          onChange={(e) => setManualCalories(e.target.value)}
                          className="w-full mt-1 bg-transparent text-white font-mono font-black text-base outline-none focus:border-b border-[#007AFF]"
                        />
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900 border border-blue-500/30">
                        <span className="text-[10px] uppercase font-black tracking-wider text-blue-400 block">
                          Proteínas (g)
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={manualProtein}
                          onChange={(e) => setManualProtein(e.target.value)}
                          className="w-full mt-1 bg-transparent text-white font-mono font-black text-base outline-none focus:border-b border-blue-500"
                        />
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900 border border-amber-500/30">
                        <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block">
                          Carbos (g)
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={manualCarbs}
                          onChange={(e) => setManualCarbs(e.target.value)}
                          className="w-full mt-1 bg-transparent text-white font-mono font-black text-base outline-none focus:border-b border-amber-500"
                        />
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900 border border-emerald-500/30">
                        <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 block">
                          Gorduras (g)
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={manualFat}
                          onChange={(e) => setManualFat(e.target.value)}
                          className="w-full mt-1 bg-transparent text-white font-mono font-black text-base outline-none focus:border-b border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lista de Alimentos Opcional */}
                  <div className="space-y-2 pt-1 border-t border-zinc-900">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-300">
                        Alimentos / Ingredientes (Opcional)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddManualItem}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007AFF] hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar Alimento</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {manualItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Alimento (ex: Frango grelhado)"
                            value={item.name}
                            onChange={(e) => handleUpdateManualItem(idx, "name", e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-[#007AFF]"
                          />
                          <input
                            type="text"
                            placeholder="Porção (ex: 150g)"
                            value={item.portion}
                            onChange={(e) => handleUpdateManualItem(idx, "portion", e.target.value)}
                            className="w-28 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-[#007AFF]"
                          />
                          {manualItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveManualItem(idx)}
                              className="p-2 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                              title="Remover item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Observações (Opcional)
                    </label>
                    <input
                      type="text"
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      placeholder="Ex: Bebeu 400ml de água junto, sem açúcar..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>

                  {/* Botão Salvar Manual */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={isSaving || !manualTitle.trim()}
                      onClick={handleSaveManualMeal}
                      className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-[#007AFF]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Salvar Refeição Manual</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Photo Input Area */}
              {activeMode === "photo" && (
                <div className="space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-blue-500/40 bg-zinc-900 aspect-video max-h-64 flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="Prato"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setImagePreview(null)}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 hover:bg-black text-white text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-zinc-800 hover:border-blue-500/60 rounded-2xl p-8 text-center cursor-pointer bg-zinc-900/40 hover:bg-zinc-900 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-zinc-200">
                        Clique para enviar ou tirar foto do prato
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        PNG, JPG ou WEBP até 10MB (O Gulinha identificará porções e macros)
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Detalhes adicionais (opcional)
                    </label>
                    <input
                      type="text"
                      value={descriptionText}
                      onChange={(e) => setDescriptionText(e.target.value)}
                      placeholder="Ex: 2 filés médios com azeite de oliva e arroz integral..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Text Input Area */}
              {activeMode === "text" && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-zinc-300">
                    O que você comeu nessa refeição?
                  </label>
                  <textarea
                    rows={4}
                    value={descriptionText}
                    onChange={(e) => setDescriptionText(e.target.value)}
                    placeholder="Ex: 150g de peito de frango grelhado, 180g de arroz branco, 1 concha de feijão carioca, salada verde com 1 colher de azeite e 1 copo de suco de laranja natural..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                  <p className="text-[11px] text-zinc-400">
                    O Gulinha irá calcular automaticamente as calorias, proteínas, carboidratos e gorduras de cada item.
                  </p>
                </div>
              )}

              {/* Error Message */}
              {analysisError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  id="start-meal-analysis-btn"
                  disabled={isAnalyzing || (!imagePreview && !descriptionText.trim())}
                  onClick={handleAnalyze}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-[#007AFF]/25 flex items-center justify-center gap-2 transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Gulinha IA Analisando Prato...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 stroke-[2.5]" />
                      <span>Processar Nutrição com Gulinha</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Review & Confirm Results Screen */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Header Title, Category & Date */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                      Título da Refeição
                    </label>
                    <input
                      type="text"
                      value={analyzedMeal.mealName}
                      onChange={(e) =>
                        setAnalyzedMeal({ ...analyzedMeal, mealName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-bold focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                      Momento do Dia
                    </label>
                    <select
                      value={analyzedMeal.mealType}
                      onChange={(e) =>
                        setAnalyzedMeal({
                          ...analyzedMeal,
                          mealType: e.target.value as MealCategory,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-bold focus:outline-none focus:border-[#007AFF]"
                    >
                      <option value="breakfast">Café da Manhã</option>
                      <option value="lunch">Almoço</option>
                      <option value="snack">Lanche</option>
                      <option value="dinner">Jantar</option>
                      <option value="pre_workout">Pré-Treino</option>
                      <option value="post_workout">Pós-Treino</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                      Data da Refeição
                    </label>
                    <input
                      type="date"
                      value={mealDate}
                      onChange={(e) => setMealDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-bold focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                </div>

                {/* Macro summary pills */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-zinc-800 text-center">
                  <div className="p-3 rounded-xl bg-zinc-950 border border-[#007AFF]/30">
                    <div className="text-[10px] uppercase font-black tracking-wider text-[#007AFF]">Calorias</div>
                    <div className="text-base font-black text-white font-mono mt-0.5">
                      {analyzedMeal.totalCalories} <span className="text-[10px] text-zinc-500 font-normal">kcal</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] uppercase font-black tracking-wider text-blue-400">Proteínas</div>
                    <div className="text-base font-black text-white font-mono mt-0.5">
                      {analyzedMeal.totalProtein}g
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] uppercase font-black tracking-wider text-amber-400">Carboidratos</div>
                    <div className="text-base font-black text-amber-400 font-mono mt-0.5">
                      {analyzedMeal.totalCarbs}g
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] uppercase font-black tracking-wider text-emerald-400">Gorduras</div>
                    <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                      {analyzedMeal.totalFat}g
                    </div>
                  </div>
                </div>
              </div>

              {/* Gulinha Coach Feedback */}
              {analyzedMeal.gulinhaFeedback && (
                <div className="p-4 rounded-xl bg-zinc-900 border border-[#007AFF]/30 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-[#007AFF] shrink-0 mt-0.5" />
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    <strong className="text-[#007AFF] block mb-1 font-mono uppercase tracking-wider text-[11px]">Parecer do Gulinha:</strong>
                    {analyzedMeal.gulinhaFeedback}
                  </div>
                </div>
              )}

              {/* Items Breakdown Table */}
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Itens Identificados ({analyzedMeal.items.length})</span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    Você pode editar porções e macros
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {analyzedMeal.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(idx, "name", e.target.value)}
                          className="w-full bg-transparent font-bold text-white focus:outline-none focus:underline"
                        />
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>{item.portion}</span>
                          <span>•</span>
                          <span className="text-[#007AFF] font-mono font-bold">{item.calories} kcal</span>
                          <span>•</span>
                          <span className="text-zinc-300 font-mono">P: {item.protein}g</span>
                          <span>•</span>
                          <span className="text-amber-400 font-mono">C: {item.carbs}g</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-mono">G: {item.fat}g</span>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteItem(idx)}
                        className="text-zinc-500 hover:text-red-400 p-1.5"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Confirm Buttons */}
              <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-zinc-400 hover:text-white font-bold"
                >
                  Escanear Novamente
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-bold hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    id="save-analyzed-meal-btn"
                    disabled={isSaving}
                    onClick={handleConfirmSave}
                    className="px-6 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] disabled:opacity-70 disabled:cursor-not-allowed text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-[#007AFF]/25 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Salvar no Diário</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
