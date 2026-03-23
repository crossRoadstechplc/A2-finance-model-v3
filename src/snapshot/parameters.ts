/**
 * User-editable snapshot model parameters (persisted with assumptions).
 * Percent-like fields use 0–100 where noted; prices are USD/kWh.
 */

export type InfrastructureOverrides = {
  stations: number | null
  sockets: number | null
  bays: number | null
}

export type SnapshotModelParameters = {
  infrastructureOverrides: InfrastructureOverrides
  chargingWindowHoursPerDay: number
  socketOutputKw: number
  /** 0–1 effective utilization of socket-hour capacity */
  socketEffectiveUtilization: number
  swapMinutesPerVehicle: number
  /** 0–1 swap bay busy factor within the charging window */
  swapBayUtilization: number
  kwhPerChargingTruckDay: number
  swapsPerSwapTruckDay: number
  /** 0–1 share of fleet on depot/charging vs swap */
  fleetChargingShare: number
  gridPassThroughUsdPerKwh: number
  a2EnergyUsdPerKwh: number
  a2PlatformUsdPerKwh: number
  /** Flat swap service fee (USD per swap completion) */
  swapServiceUsdPerSwap: number
}
