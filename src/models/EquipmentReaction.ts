import type {
  Reaction,
} from '@settingforge/module-sdk'

import type {
  EquipmentEffect,
} from './EquipmentEffect'

export interface EquipmentReaction {
  id: string
  name?: string

  trigger: Reaction

  effect: EquipmentEffect
}