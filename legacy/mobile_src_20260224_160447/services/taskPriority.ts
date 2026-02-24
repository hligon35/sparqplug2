export type TaskPriority = "high" | "med" | "low";

export function normalizePriority(p?: string): TaskPriority {
  const v = (p ?? "").toLowerCase();
  if (v === "high") return "high";
  if (v === "med" || v === "medium") return "med";
  return "low";
}

export function priorityDotClass(priority: TaskPriority): string {
  switch (priority) {
    case "high":
      return "bg-red-500";
    case "med":
      return "bg-amber-500";
    case "low":
      return "bg-emerald-500";
  }
}

export function priorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case "high":
      return "HIGH";
    case "med":
      return "MED";
    case "low":
      return "LOW";
  }
}
