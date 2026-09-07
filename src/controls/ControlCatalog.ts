import type {
  EquipmentControl,
  EquipmentControlType,
} from '../models/Control'

export interface EquipmentControlDefinition {
  type: EquipmentControlType
  name: string
  description: string

  createDefault():
    Omit<EquipmentControl, 'id'>
}

const controlDefinitions:
  EquipmentControlDefinition[] = [
    {
      type: 'display-image',

      name: 'Display Image',

      description:
        'Displays an image on a compatible Room Feature.',

      createDefault: () => ({
        type: 'display-image',
        name: 'Display Image',
      }),
    },
  ]

export function getControlDefinitions():
  EquipmentControlDefinition[] {
  return controlDefinitions
}