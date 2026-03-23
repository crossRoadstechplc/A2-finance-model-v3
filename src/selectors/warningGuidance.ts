import type {
  DashboardConstraintBanner,
  DashboardWarningBanner,
  EntityConstraintItem,
  EntityWarningItem,
} from "@/selectors/types"
import type { SnapshotConstraint, SnapshotWarning } from "@/snapshot/types"

type Guidance = {
  title: string
  explanation: string | null
  actions: readonly string[]
}

function guidanceForCode(code: string): Guidance {
  switch (code) {
    case "CHARGING_SOCKET_THROUGHPUT_SHORTFALL":
      return {
        title: "Charging socket throughput shortfall",
        explanation:
          "The fleet needs more charging energy per day than the configured sockets can deliver during the overnight charging window.",
        actions: [
          'Increase "Sockets / station" in Fleet economics > Scaling bands table.',
          'Increase "Stations override" in Technical & operating, or raise stations in the Scaling bands table.',
          'Reduce "Fleet vehicles (active / base year)" in Market & fleet.',
          'Reduce "Truck consumption (kWh / km)" in Technical & operating.',
          'Reduce "Charge time (minutes)" in Technical & operating.',
          'Increase "Compatibility charging window (hours / day)" in Technical & operating if the scenario allows it.',
        ],
      }
    case "CHARGED_BATTERY_PRODUCTION_SHORTFALL":
      return {
        title: "Charged battery production shortfall",
        explanation:
          "The corridor cannot produce enough fully charged batteries overnight to support next-day swap demand.",
        actions: [
          'Increase "Sockets / station" in Fleet economics > Scaling bands table.',
          'Increase "Stations override" in Technical & operating, or raise stations in the Scaling bands table.',
          'Reduce "Fleet vehicles (active / base year)" in Market & fleet.',
          'Reduce "Charge time (minutes)" in Technical & operating.',
          'Increase "Battery capacity (kWh)" only if your truck and battery configuration supports it.',
          'Increase "Compatibility charging window (hours / day)" in Technical & operating if the scenario allows it.',
        ],
      }
    case "SWAP_BAY_THROUGHPUT_SHORTFALL":
      return {
        title: "Swap bay throughput shortfall",
        explanation:
          "Truck swap demand exceeds how many swap events the configured bays can process in a day.",
        actions: [
          'Increase "Swap bays override" in Technical & operating.',
          'Increase "Bays / station" in Fleet economics > Scaling bands table.',
          'Increase "Stations override" in Technical & operating, or raise stations in the Scaling bands table.',
          'Reduce "Fleet vehicles (active / base year)" in Market & fleet.',
          'Reduce "Swap time (minutes)" in Technical & operating.',
        ],
      }
    case "SNAPSHOT_INFRASTRUCTURE_OVERRIDE_ACTIVE":
      return {
        title: "Infrastructure override active",
        explanation:
          "A manual infrastructure override is active, so the corridor is no longer following the default scaling band for that item.",
        actions: [
          'Review "Stations override", "Sockets override", and "Swap bays override" in Technical & operating.',
          "Clear the override if you want the scaling table to drive infrastructure sizing again.",
        ],
      }
    case "SNAPSHOT_OVERRIDE_CLAMPED_NEGATIVE":
      return {
        title: "Negative override clamped",
        explanation:
          "A negative override was entered and automatically clamped to zero before the model ran.",
        actions: [
          'Enter a zero-or-positive value in "Stations override", "Sockets override", or "Swap bays override" in Technical & operating.',
        ],
      }
    default:
      return {
        title: code
          .toLowerCase()
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
        explanation: null,
        actions: [],
      }
  }
}

export function toDashboardWarningBanner(
  warning: SnapshotWarning,
): DashboardWarningBanner {
  const guidance = guidanceForCode(warning.code)
  return {
    severity: warning.severity,
    code: warning.code,
    stage: warning.stage,
    title: guidance.title,
    message: warning.message,
    explanation: guidance.explanation,
    actions: guidance.actions,
  }
}

export function toDashboardConstraintBanner(
  constraint: SnapshotConstraint,
): DashboardConstraintBanner {
  const guidance = guidanceForCode(constraint.code)
  return {
    binding: constraint.binding,
    code: constraint.code,
    title: guidance.title,
    message: constraint.message,
    shortfall: constraint.shortfall,
    explanation: guidance.explanation,
    actions: guidance.actions,
  }
}

export function toEntityWarningItem(warning: SnapshotWarning): EntityWarningItem {
  const guidance = guidanceForCode(warning.code)
  return {
    severity: warning.severity,
    code: warning.code,
    stage: warning.stage,
    title: guidance.title,
    message: warning.message,
    explanation: guidance.explanation,
    actions: guidance.actions,
  }
}

export function toEntityConstraintItem(
  constraint: SnapshotConstraint,
): EntityConstraintItem {
  const guidance = guidanceForCode(constraint.code)
  return {
    binding: constraint.binding,
    code: constraint.code,
    title: guidance.title,
    message: constraint.message,
    explanation: guidance.explanation,
    actions: guidance.actions,
  }
}
