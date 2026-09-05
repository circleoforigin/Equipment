import type {
  EquipmentCapability,
} from './Capability';

export interface EquipmentDevice {
  id: string;
  name: string;

  providerId: string;
  providerDeviceId: string;

  capabilities: EquipmentCapability[];

  createdAt: string;
  updatedAt: string;
}