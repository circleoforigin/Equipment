import {
  moduleEventBus,
} from './ModuleBus'

export function announceEquipmentReady(): void {
  moduleEventBus.emit(
    'module.ready',
    {},
  )
}