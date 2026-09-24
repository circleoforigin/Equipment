import {
  projectCommandDefinitions,
  projectEventDefinitions,
  projectQueryDefinitions,
} from '@settingforge/module-sdk';

import type {
  CommandDefinition,
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

export const executeControlCommandDefinition:
  CommandDefinition = {
    id: 'Equipment.ExecuteControl',

    label: 'Execute Control',

    description:
      'Executes a Control in the active Equipment project.',

    input: [
      {
        key: 'controlId',
        label: 'Control ID',
        type: 'string',
        required: true,
      },
      {
        key: 'sourceModuleId',
        label: 'Source Module ID',
        type: 'string',
      },
      {
        key: 'eventPayload',
        label: 'Event Payload',
        type: 'object',
      },
    ],
  };

export const equipmentEventDefinitions = [
  displayAvailableEvent,
  ...projectEventDefinitions,
];

export const equipmentCommandDefinitions = [
  executeControlCommandDefinition,
  ...projectCommandDefinitions,
];

export const equipmentQueryDefinitions = [
  ...projectQueryDefinitions,
];