export type EquipmentControlType =
  | 'display-image'

export interface EquipmentControl {
  id: string

  type: EquipmentControlType

  name: string

  /**
   * Logical media slot consumed from
   * an incoming cross-module event.
   */
  mediaSlot?: number

  /**
   * Semantic Feature in the active Room
   * that this Control targets.
   */
  targetFeatureId?: string
}