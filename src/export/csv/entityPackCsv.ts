import type { EntityPageViewModel } from "@/selectors/types"

import { stackedDocumentTablesToCsv } from "@/export/csv/documentTableCsv"

export function entityPackDocumentTables(vm: EntityPageViewModel) {
  return [
    vm.incomeStatement,
    vm.balanceSheet,
    vm.cashFlowStatement,
    vm.equityStatement,
    vm.debtSchedule,
    vm.capexSchedule,
    vm.sourcesUsesSchedule,
  ]
}

export function entityPackTablesCsv(vm: EntityPageViewModel): string {
  return stackedDocumentTablesToCsv(entityPackDocumentTables(vm))
}
