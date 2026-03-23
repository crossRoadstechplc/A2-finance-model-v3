import type { SnapshotModelParameters } from "@/snapshot/parameters"

export const defaultSnapshotModel: SnapshotModelParameters = {
  infrastructureOverrides: {
    stations: null,
    sockets: null,
    bays: null,
  },
  chargingWindowHoursPerDay: 7,
  socketOutputKw: 350,
  socketEffectiveUtilization: 0.95,
  swapMinutesPerVehicle: 7,
  swapBayUtilization: 0.9,
  kwhPerChargingTruckDay: 450,
  swapsPerSwapTruckDay: 4,
  fleetChargingShare: 0,
  gridPassThroughUsdPerKwh: 0.11,
  a2EnergyUsdPerKwh: 0.12,
  a2PlatformUsdPerKwh: 0.08,
  swapServiceUsdPerSwap: 0,
}
