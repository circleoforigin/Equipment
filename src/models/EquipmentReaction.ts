import {
  normalizeReaction,
} from '@settingforge/module-sdk'

import type {
  LegacyReaction,
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

export interface LegacyEquipmentReaction {
  id: string
  name?: string
  trigger:
    | Reaction
    | LegacyReaction
  effect: EquipmentEffect
}

export function normalizeEquipmentReaction(
  reaction:
    LegacyEquipmentReaction,
): EquipmentReaction {
  return {
    ...reaction,

    trigger:
      normalizeReaction(
        reaction.trigger,
      ),

    effect: {
      ...reaction.effect,
    },
  }
}