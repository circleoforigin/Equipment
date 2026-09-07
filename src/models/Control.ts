export type EquipmentControlType =
  | 'display-image'

export interface EquipmentControl {
  id: string

  type: EquipmentControlType

  name: string

  /**
   * Semantic Feature in the active Room
   * that this Control targets.
   */
  targetFeatureId?: string
}