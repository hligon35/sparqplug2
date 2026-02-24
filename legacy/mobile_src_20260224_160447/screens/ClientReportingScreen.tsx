import React, { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import type { RootStackParamList } from "../../App";
// import MarketingQuickActions from "../components/marketing/MarketingQuickActions";
import { Badge, Card, ChipSelect, DateTimeField, ListRow, ModalSurface, Screen, SectionHeader } from "../components/ui";
import {
  createCompetitiveInsight,
  createMarketingReport,
  createStrategyPlan,
  deleteCompetitiveInsight,
  deleteMarketingReport,
  deleteStrategyPlan,
  loadReportingClientData,
  updateCompetitiveInsight,
  updateMarketingReport,
  updateStrategyPlan,
  type CompetitiveInsight,
  type MarketingReport,
  type StrategyPlan
} from "../services/marketingReportingService";
import { runMarketingTask } from "../services/aiService";
import { useAdminGate } from "../components/useAdminGate";

export default function ClientReportingScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ClientReporting">>();
  const { clientId } = route.params;

  const gate = useAdminGate("Reporting & Strategy");

  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [engineId, setEngineId] = useState<number | null>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string>("");

  const [reports, setReports] = useState<MarketingReport[]>([]);
  const [insights, setInsights] = useState<CompetitiveInsight[]>([]);
  const [plans, setPlans] = useState<StrategyPlan[]>([]);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState("");
  const [reportDue, setReportDue] = useState("");
  const [reportStatus, setReportStatus] = useState("draft");

  const [reportEditOpen, setReportEditOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<MarketingReport | null>(null);
  const [reportEditMonth, setReportEditMonth] = useState("");
  const [reportEditDue, setReportEditDue] = useState("");
  const [reportEditStatus, setReportEditStatus] = useState("draft");
  const [reportEditSummary, setReportEditSummary] = useState("");

  const [insightOpen, setInsightOpen] = useState(false);
  const [competitor, setCompetitor] = useState("");
  const [insightText, setInsightText] = useState("");

  const [insightEditOpen, setInsightEditOpen] = useState(false);
  const [activeInsight, setActiveInsight] = useState<CompetitiveInsight | null>(null);
  const [insightEditCompetitor, setInsightEditCompetitor] = useState("");
  const [insightEditText, setInsightEditText] = useState("");

  const [planOpen, setPlanOpen] = useState(false);
  const [planPeriod, setPlanPeriod] = useState("monthly");
  const [planSummary, setPlanSummary] = useState("");

  const [planEditOpen, setPlanEditOpen] = useState(false);
  const [activePlan, setActivePlan] = useState<StrategyPlan | null>(null);
  const [planEditPeriod, setPlanEditPeriod] = useState("monthly");
  const [planEditSummary, setPlanEditSummary] = useState("");
  const [planEditActionPlan, setPlanEditActionPlan] = useState("");

  const canAddReport = useMemo(() => !!engineId, [engineId]);
  const canAddInsight = useMemo(() => insightText.trim().length > 0 && !!engineId, [insightText, engineId]);
  const canAddPlan = useMemo(() => planSummary.trim().length > 0 && !!engineId, [planSummary, engineId]);
  const canSaveReport = useMemo(() => !!activeReport, [activeReport]);
  const canSaveInsight = useMemo(() => insightEditText.trim().length > 0, [insightEditText]);
  const canSavePlan = useMemo(() => planEditSummary.trim().length > 0, [planEditSummary]);

  async function askCopilot() {
    setAiOpen(true);
    setAiBusy(true);
    setAiError(null);
    setAiText("");

    const res = await runMarketingTask(Number(clientId), "reporting", "report_insights", "markdown");
    if (!res.ok) {
      setAiError(res.error);
      setAiBusy(false);
      return;
    }

    const output = res.data?.output;
    const text =
      (output?.format === "markdown" && typeof output?.text === "string" && output.text) ||
      JSON.stringify(output ?? res.data, null, 2);
    setAiText(text);
    setAiBusy(false);
  }

  function openReportEditor(r: MarketingReport) {
    setActiveReport(r);
    setReportEditMonth(r.month ?? "");
    setReportEditDue(r.due_date ?? "");
    setReportEditStatus(r.status ?? "draft");
    setReportEditSummary(r.summary ?? "");
    setReportEditOpen(true);
  }

  function openInsightEditor(i: CompetitiveInsight) {
    setActiveInsight(i);
    setInsightEditCompetitor(i.competitor ?? "");
    setInsightEditText(i.insight ?? "");
    setInsightEditOpen(true);
  }

  function openPlanEditor(p: StrategyPlan) {
    setActivePlan(p);
    setPlanEditPeriod(p.period ?? "monthly");
    setPlanEditSummary(p.summary ?? "");
    setPlanEditActionPlan(p.action_plan ?? "");
    setPlanEditOpen(true);
  }

  async function refresh() {
    try {
      setStatus(null);
      const res = await loadReportingClientData(Number(clientId));
      setEngineId(res.engineId);
      setReports(res.reports);
      setInsights(res.insights);
      setPlans(res.plans);
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to load reporting");
    }
  }

  useEffect(() => {
    if (!gate.enabled) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, gate.enabled]);

  async function addReport() {
    if (!engineId) return;
    try {
      setStatus(null);
      setBusy(true);
      const created = await createMarketingReport({
        engine: engineId,
        month: reportMonth || null,
        status: reportStatus,
        metrics: {},
        summary: "",
        due_date: reportDue || null,
        delivered_at: null,
        linked_task: null,
        linked_calendar_item: null
      });
      setReports((prev) => [created, ...prev]);
      setReportMonth("");
      setReportDue("");
      setReportStatus("draft");
      setReportOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add report");
    } finally {
      setBusy(false);
    }
  }

  async function saveReportEdits() {
    if (!activeReport || !canSaveReport) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateMarketingReport(activeReport.id, {
        month: reportEditMonth || null,
        due_date: reportEditDue || null,
        status: reportEditStatus,
        summary: reportEditSummary
      });
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setReportEditOpen(false);
      setActiveReport(null);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save report");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteReport(r: MarketingReport) {
    Alert.alert("Delete report?", r.month ? `Report ${r.month}` : "Report", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMarketingReport(r.id);
            setReports((prev) => prev.filter((x) => x.id !== r.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete report");
          }
        }
      }
    ]);
  }

  async function addInsight() {
    if (!engineId || !canAddInsight) return;
    try {
      setStatus(null);
      setBusy(true);
      const created = await createCompetitiveInsight({
        engine: engineId,
        competitor,
        insight: insightText.trim(),
        collected_at: null
      });
      setInsights((prev) => [created, ...prev]);
      setCompetitor("");
      setInsightText("");
      setInsightOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add insight");
    } finally {
      setBusy(false);
    }
  }

  async function saveInsightEdits() {
    if (!activeInsight || !canSaveInsight) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateCompetitiveInsight(activeInsight.id, {
        competitor: insightEditCompetitor,
        insight: insightEditText.trim()
      });
      setInsights((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setInsightEditOpen(false);
      setActiveInsight(null);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save insight");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteInsight(i: CompetitiveInsight) {
    Alert.alert("Delete insight?", (i.insight ?? "").slice(0, 60) || "Insight", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCompetitiveInsight(i.id);
            setInsights((prev) => prev.filter((x) => x.id !== i.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete insight");
          }
        }
      }
    ]);
  }

  async function addPlan() {
    if (!engineId || !canAddPlan) return;
    try {
      setStatus(null);
      setBusy(true);
      const created = await createStrategyPlan({
        engine: engineId,
        period: planPeriod,
        summary: planSummary.trim(),
        action_plan: "",
        next_refresh_date: null
      });
      setPlans((prev) => [created, ...prev]);
      setPlanSummary("");
      setPlanOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add strategy plan");
    } finally {
      setBusy(false);
    }
  }

  async function savePlanEdits() {
    if (!activePlan || !canSavePlan) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateStrategyPlan(activePlan.id, {
        period: planEditPeriod,
        summary: planEditSummary.trim(),
        action_plan: planEditActionPlan
      });
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setPlanEditOpen(false);
      setActivePlan(null);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save strategy plan");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeletePlan(p: StrategyPlan) {
    Alert.alert("Delete strategy plan?", p.summary ?? "Plan", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteStrategyPlan(p.id);
            setPlans((prev) => prev.filter((x) => x.id !== p.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete plan");
          }
        }
      }
    ]);
  }

  return gate.guard ?? (
    <Screen subtitle="Reporting & Strategy" statusText={status}>
      <View className="mb-3 flex-row justify-end">
        <Pressable onPress={askCopilot} disabled={busy || aiBusy} className={busy || aiBusy ? "opacity-50" : ""}>
          <View className="h-9 px-3 rounded-full border border-gray-200 bg-white items-center justify-center flex-row gap-2">
            <Ionicons name="sparkles-outline" size={16} color="#111827" />
            <Text className="text-xs font-semibold">Ask Copilot</Text>
          </View>
        </Pressable>
      </View>

      <Modal visible={aiOpen} transparent animationType="fade" onRequestClose={() => setAiOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setAiOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface
              title="Ask Copilot"
              subtitle="Reporting • report_insights"
              headerRight={
                <Pressable onPress={() => setAiOpen(false)} hitSlop={10}>
                  <Ionicons name="close" size={22} color="#111827" />
                </Pressable>
              }
            >
              <View className="p-4">
                {aiError ? (
                  <View className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 mb-3">
                    <Text className="text-sm text-red-700">{aiError}</Text>
                  </View>
                ) : null}
                <Text className="text-xs opacity-60 mb-2">{aiBusy ? "Running..." : "Result"}</Text>
                <Text selectable className="text-sm">{aiText || (aiBusy ? "Generating..." : "No output")}</Text>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </Modal>

      {/*
      Quick actions are intentionally disabled across the app.
      This widget created linked Task + Calendar items for common actions.

      <MarketingQuickActions
        clientId={Number(clientId)}
        defaultCalendarPlatform="reporting"
        defaultCalendarContentType="deadline"
      />
      */}

      <Card>
        <SectionHeader
          title="Monthly performance reports"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={() => setReportOpen(true)}
        />
        <View className="mt-3">
          {reports.length === 0 ? (
            <Text className="text-sm opacity-70">No reports yet.</Text>
          ) : (
            reports.slice(0, 20).map((r) => (
              <ListRow
                key={r.id}
                title={r.month ? `Report ${r.month}` : "Report"}
                subtitle={`${r.status || "status"} • due ${r.due_date || "TBD"}`}
                onPress={() => openReportEditor(r)}
                right={
                  <View className="flex-row gap-2">
                    <Pressable onPress={() => openReportEditor(r)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="create-outline" size={18} color="#111827" />
                      </View>
                    </Pressable>
                    <Pressable onPress={() => confirmDeleteReport(r)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="trash-outline" size={18} color="#B91C1C" />
                      </View>
                    </Pressable>
                  </View>
                }
              />
            ))
          )}
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Competitive insights"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={() => setInsightOpen(true)}
        />
        <View className="mt-3">
          {insights.length === 0 ? (
            <Text className="text-sm opacity-70">No insights yet.</Text>
          ) : (
            insights.slice(0, 20).map((i) => (
              <ListRow
                key={i.id}
                title={i.competitor || "Competitor"}
                subtitle={i.insight.slice(0, 60)}
                onPress={() => openInsightEditor(i)}
                right={
                  <View className="flex-row gap-2">
                    <Pressable onPress={() => openInsightEditor(i)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="create-outline" size={18} color="#111827" />
                      </View>
                    </Pressable>
                    <Pressable onPress={() => confirmDeleteInsight(i)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="trash-outline" size={18} color="#B91C1C" />
                      </View>
                    </Pressable>
                  </View>
                }
              />
            ))
          )}
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Strategy plans"
          subtitle="Quarterly refreshes"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={() => setPlanOpen(true)}
        />
        <View className="mt-3">
          {plans.length === 0 ? (
            <Text className="text-sm opacity-70">No strategy plans yet.</Text>
          ) : (
            plans.slice(0, 20).map((p) => (
              <ListRow
                key={p.id}
                title={p.period || "plan"}
                subtitle={p.summary || ""}
                onPress={() => openPlanEditor(p)}
                right={
                  <View className="flex-row gap-2">
                    <Pressable onPress={() => openPlanEditor(p)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="create-outline" size={18} color="#111827" />
                      </View>
                    </Pressable>
                    <Pressable onPress={() => confirmDeletePlan(p)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="trash-outline" size={18} color="#B91C1C" />
                      </View>
                    </Pressable>
                  </View>
                }
              />
            ))
          )}
        </View>
      </Card>

      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setReportOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Add marketing report</Text>

            <DateTimeField label="Month" mode="month" value={reportMonth} onChange={setReportMonth} placeholder="Pick a month" />

            <DateTimeField label="Due date" mode="date" value={reportDue} onChange={setReportDue} placeholder="Pick a due date" />

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Status</Text>
              <ChipSelect
                value={reportStatus}
                onChange={setReportStatus}
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Published", value: "published" },
                  { label: "Delivered", value: "delivered" }
                ]}
              />
              <View className="mt-2" />
              <TextInput value={reportStatus} onChangeText={setReportStatus} placeholder="draft" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setReportOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={addReport} disabled={!canAddReport || busy} className={!canAddReport || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Creating..." : "Create"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={reportEditOpen} transparent animationType="fade" onRequestClose={() => setReportEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setReportEditOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Edit marketing report</Text>

            <DateTimeField label="Month" mode="month" value={reportEditMonth} onChange={setReportEditMonth} placeholder="Pick a month" />

            <DateTimeField label="Due date" mode="date" value={reportEditDue} onChange={setReportEditDue} placeholder="Pick a due date" />

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Status</Text>
              <ChipSelect
                value={reportEditStatus}
                onChange={setReportEditStatus}
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Published", value: "published" },
                  { label: "Delivered", value: "delivered" }
                ]}
              />
              <View className="mt-2" />
              <TextInput value={reportEditStatus} onChangeText={setReportEditStatus} placeholder="draft" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Summary</Text>
              <TextInput value={reportEditSummary} onChangeText={setReportEditSummary} placeholder="" multiline className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setReportEditOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={saveReportEdits} disabled={!canSaveReport || busy} className={!canSaveReport || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Saving..." : "Save"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={insightOpen} transparent animationType="fade" onRequestClose={() => setInsightOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setInsightOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Add competitive insight</Text>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Competitor</Text>
              <TextInput value={competitor} onChangeText={setCompetitor} placeholder="Competitor name" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Insight</Text>
              <TextInput value={insightText} onChangeText={setInsightText} placeholder="What did you learn?" multiline className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setInsightOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={addInsight} disabled={!canAddInsight || busy} className={!canAddInsight || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Creating..." : "Create"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={insightEditOpen} transparent animationType="fade" onRequestClose={() => setInsightEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setInsightEditOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Edit competitive insight</Text>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Competitor</Text>
              <TextInput value={insightEditCompetitor} onChangeText={setInsightEditCompetitor} placeholder="Competitor name" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Insight</Text>
              <TextInput value={insightEditText} onChangeText={setInsightEditText} placeholder="What did you learn?" multiline className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setInsightEditOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={saveInsightEdits} disabled={!canSaveInsight || busy} className={!canSaveInsight || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Saving..." : "Save"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={planOpen} transparent animationType="fade" onRequestClose={() => setPlanOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setPlanOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Add strategy plan</Text>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Period</Text>
              <ChipSelect
                value={planPeriod}
                onChange={setPlanPeriod}
                options={[
                  { label: "Monthly", value: "monthly" },
                  { label: "Quarterly", value: "quarterly" },
                  { label: "Annual", value: "annual" }
                ]}
              />
              <View className="mt-2" />
              <TextInput value={planPeriod} onChangeText={setPlanPeriod} placeholder="monthly" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Summary</Text>
              <TextInput value={planSummary} onChangeText={setPlanSummary} placeholder="High-level action plan" multiline className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setPlanOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={addPlan} disabled={!canAddPlan || busy} className={!canAddPlan || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Creating..." : "Create"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={planEditOpen} transparent animationType="fade" onRequestClose={() => setPlanEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setPlanEditOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Edit strategy plan</Text>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Period</Text>
              <ChipSelect
                value={planEditPeriod}
                onChange={setPlanEditPeriod}
                options={[
                  { label: "Monthly", value: "monthly" },
                  { label: "Quarterly", value: "quarterly" },
                  { label: "Annual", value: "annual" }
                ]}
              />
              <View className="mt-2" />
              <TextInput value={planEditPeriod} onChangeText={setPlanEditPeriod} placeholder="monthly" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Summary</Text>
              <TextInput value={planEditSummary} onChangeText={setPlanEditSummary} placeholder="High-level action plan" multiline className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Action plan</Text>
              <TextInput value={planEditActionPlan} onChangeText={setPlanEditActionPlan} placeholder="" multiline className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setPlanEditOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={savePlanEdits} disabled={!canSavePlan || busy} className={!canSavePlan || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Saving..." : "Save"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

// --- Change Summary ---
// Added an "Ask Copilot" button + modal that calls runMarketingTask() for Reporting tasks.
