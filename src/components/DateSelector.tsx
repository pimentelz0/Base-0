import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  RotateCcw,
} from "lucide-react";

interface DateSelectorProps {
  selectedDate: string; // Format: YYYY-MM-DD
  onChangeDate: (dateStr: string) => void;
  className?: string;
}

const MONTHS = [
  { short: "Jan", full: "Janeiro", num: "01" },
  { short: "Fev", full: "Fevereiro", num: "02" },
  { short: "Mar", full: "Março", num: "03" },
  { short: "Abr", full: "Abril", num: "04" },
  { short: "Mai", full: "Maio", num: "05" },
  { short: "Jun", full: "Junho", num: "06" },
  { short: "Jul", full: "Julho", num: "07" },
  { short: "Ago", full: "Agosto", num: "08" },
  { short: "Set", full: "Setembro", num: "09" },
  { short: "Out", full: "Outubro", num: "10" },
  { short: "Nov", full: "Novembro", num: "11" },
  { short: "Dez", full: "Dezembro", num: "12" },
];

const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onChangeDate,
  className = "",
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  // Popover state
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"day" | "month" | "year">("day");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Safe parsing
  const [yearStr, monthStr, dayStr] = selectedDate.split("-");
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;
  const day = parseInt(dayStr, 10) || new Date().getDate();

  const daysInMonth = new Date(year, month, 0).getDate();
  const clampedDay = Math.min(day, daysInMonth);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Years range
  const currentYear = new Date().getFullYear();
  const yearsArray = Array.from({ length: 9 }, (_, i) => currentYear - 4 + i);

  // First day of current month (0=Sun, 1=Mon, ..., 6=Sat)
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const updateDate = (newYear: number, newMonth: number, newDay: number) => {
    const maxDays = new Date(newYear, newMonth, 0).getDate();
    const safeDay = Math.min(newDay, maxDays);
    const dateFormatted = `${newYear}-${String(newMonth).padStart(
      2,
      "0"
    )}-${String(safeDay).padStart(2, "0")}`;
    onChangeDate(dateFormatted);
  };

  const handleOpenSegment = (tab: "day" | "month" | "year") => {
    setActiveTab(tab);
    setIsOpen(true);
  };

  return (
    <div className={`relative flex justify-center w-full ${className}`} ref={popoverRef}>
      {/* Centralized Minimalist Capsule Pill: DD / MM / YYYY */}
      <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-sm backdrop-blur-md">
        {/* Dia */}
        <button
          type="button"
          onClick={() => handleOpenSegment("day")}
          className={`px-2 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            isOpen && activeTab === "day"
              ? "bg-[#007AFF] text-black shadow-sm font-black"
              : "text-zinc-200 hover:text-white hover:bg-zinc-800"
          }`}
          title="Selecionar Dia"
        >
          {String(clampedDay).padStart(2, "0")}
        </button>

        <span className="text-zinc-600 font-mono text-xs select-none">/</span>

        {/* Mês */}
        <button
          type="button"
          onClick={() => handleOpenSegment("month")}
          className={`px-2 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            isOpen && activeTab === "month"
              ? "bg-[#007AFF] text-black shadow-sm font-black"
              : "text-zinc-200 hover:text-white hover:bg-zinc-800"
          }`}
          title="Selecionar Mês"
        >
          {String(month).padStart(2, "0")}
        </button>

        <span className="text-zinc-600 font-mono text-xs select-none">/</span>

        {/* Ano */}
        <button
          type="button"
          onClick={() => handleOpenSegment("year")}
          className={`px-2 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            isOpen && activeTab === "year"
              ? "bg-[#007AFF] text-black shadow-sm font-black"
              : "text-zinc-200 hover:text-white hover:bg-zinc-800"
          }`}
          title="Selecionar Ano"
        >
          {year}
        </button>

        {/* Calendar Trigger */}
        <button
          type="button"
          onClick={() => handleOpenSegment("day")}
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ml-1 ${
            isOpen
              ? "bg-[#007AFF] text-black"
              : "text-zinc-400 hover:text-[#007AFF] hover:bg-zinc-800"
          }`}
          title="Abrir calendário"
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Popover Modal */}
      {isOpen && (
        <div className="absolute top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl bg-zinc-950 border border-zinc-800 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-3">
            <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-zinc-900 border border-zinc-800/80">
              <button
                type="button"
                onClick={() => setActiveTab("day")}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  activeTab === "day"
                    ? "bg-[#007AFF] text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Dia
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("month")}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  activeTab === "month"
                    ? "bg-[#007AFF] text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Mês
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("year")}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  activeTab === "year"
                    ? "bg-[#007AFF] text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Ano
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* TAB 1: DIA */}
          {activeTab === "day" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const newMonth = month === 1 ? 12 : month - 1;
                    const newYear = month === 1 ? year - 1 : year;
                    updateDate(newYear, newMonth, clampedDay);
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("month")}
                    className="font-bold text-white hover:text-[#007AFF] transition-colors cursor-pointer"
                  >
                    {MONTHS[month - 1].full}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("year")}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {year}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newMonth = month === 12 ? 1 : month + 1;
                    const newYear = month === 12 ? year + 1 : year;
                    updateDate(newYear, newMonth, clampedDay);
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS_SHORT.map((wd) => (
                  <span
                    key={wd}
                    className="text-[10px] font-mono font-bold text-zinc-500 uppercase"
                  >
                    {wd}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => {
                  const prevMonthDay =
                    daysInPrevMonth - firstDayOfMonth + i + 1;
                  return (
                    <span
                      key={`empty-${i}`}
                      className="h-8 flex items-center justify-center text-[11px] font-mono text-zinc-700 select-none"
                    >
                      {prevMonthDay}
                    </span>
                  );
                })}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = dayNum === clampedDay;
                  const isDayToday =
                    `${year}-${String(month).padStart(2, "0")}-${String(
                      dayNum
                    ).padStart(2, "0")}` === todayStr;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => {
                        updateDate(year, month, dayNum);
                        setIsOpen(false);
                      }}
                      className={`h-8 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center relative ${
                        isSelected
                          ? "bg-[#007AFF] text-black font-black shadow-md shadow-[#007AFF]/30 scale-105 z-10"
                          : isDayToday
                          ? "border border-[#007AFF]/40 text-[#007AFF] hover:bg-zinc-900"
                          : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                      }`}
                    >
                      {dayNum}
                      {isDayToday && !isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#007AFF]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MÊS */}
          {activeTab === "month" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="text-center text-xs font-bold text-zinc-400 mb-2 font-mono">
                Mês ({year})
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MONTHS.map((m, idx) => {
                  const monthNum = idx + 1;
                  const isSelected = monthNum === month;
                  return (
                    <button
                      key={m.short}
                      type="button"
                      onClick={() => {
                        updateDate(year, monthNum, clampedDay);
                        setActiveTab("day");
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? "bg-[#007AFF] text-black font-black shadow-sm"
                          : "bg-zinc-900/70 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900"
                      }`}
                    >
                      <span>{m.num}</span>
                      <span
                        className={`text-[9px] font-normal ${
                          isSelected ? "text-black/80 font-bold" : "text-zinc-500"
                        }`}
                      >
                        {m.short}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ANO */}
          {activeTab === "year" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="text-center text-xs font-bold text-zinc-400 mb-2 font-mono">
                Ano
              </div>
              <div className="grid grid-cols-3 gap-2">
                {yearsArray.map((y) => {
                  const isSelected = y === year;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        updateDate(y, month, clampedDay);
                        setActiveTab("month");
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? "bg-[#007AFF] text-black font-black shadow-sm"
                          : "bg-zinc-900/70 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900"
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-zinc-900 pt-3 mt-3">
            <button
              type="button"
              onClick={() => {
                onChangeDate(todayStr);
                setIsOpen(false);
              }}
              className="text-xs font-mono text-[#007AFF] hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Hoje</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-mono font-bold transition-colors cursor-pointer border border-zinc-800"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
