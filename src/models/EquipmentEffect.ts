export interface EquipmentControlExecutionContext {
  sourceModuleId: string
  payload: unknown
}

export interface ExecuteControlEffect {
  type: 'execute-control'
  controlId: string
}

export type EquipmentEffect =
  ExecuteControlEffect