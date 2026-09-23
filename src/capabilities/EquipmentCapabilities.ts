import {
  projectCommandDefinitions,
  projectEventDefinitions,
  projectQueryDefinitions,
} from '@settingforge/module-sdk';

import type {
  EventDefinition,
} from '@settingforge/module-sdk';

const displayAvailableEvent:
  EventDefinition = {
    id: 'Equipment.DisplayAvailable',
    label: 'Display Available',
    description:
      'Raised when Equipment exposes an available display feature.',
    delivery: 'transient',
    fields: [
      {
        key: 'roomId',
        label: 'Room ID',
        type: 'string',
      },
      {
        key: 'roomName',
        label: 'Room Name',
        type: 'string',
      },
      {
        key: 'featureId',
        label: 'Feature ID',
        type: 'string',
      },
      {
        key: 'alias',
        label: 'Alias',
        type: 'string',
      },
    ],
  };

export const equipmentEventDefinitions = [
  displayAvailableEvent,
  ...projectEventDefinitions,
];

export const equipmentCommandDefinitions = [
  ...projectCommandDefinitions,
];

export const equipmentQueryDefinitions = [
  ...projectQueryDefinitions,
];