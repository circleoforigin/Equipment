import {
  reactionMatches,
} from '@settingforge/module-sdk'

import type {
  HostEventMessage,
  ModuleEventBus,
  RegisteredEventDefinition,
} from '@settingforge/module-sdk'

import type {
  EquipmentProject,
} from '../models/Project'

import {
  moduleEventBus,
} from '../host/ModuleBus'

type ProjectProvider =
  () => EquipmentProject | null

type CommandExecutor =
  (
    commandId: string,
    payload: unknown,
  ) => Promise<void>

export class EquipmentActionManager {
  private readonly eventBus:
    ModuleEventBus

  private readonly eventSubscriptions =
    new Map<
      string,
      () => void
    >()

  private stopCatalogSubscription:
    (() => void) | null =
      null

  private getProject:
    ProjectProvider =
      () => null

  private executeCommand:
    CommandExecutor =
      async () => undefined

  constructor(
    eventBus: ModuleEventBus,
  ) {
    this.eventBus =
      eventBus
  }

  start(
    getProject:
      ProjectProvider,

    executeCommand:
      CommandExecutor,
  ): () => void {
    this.stop()

    this.getProject =
      getProject

    this.executeCommand =
      executeCommand

    this.stopCatalogSubscription =
      this.eventBus
        .onCapabilitiesChanged(
          (capabilities) =>
            this.synchronizeSubscriptions(
              capabilities.events,
            ),
        )

    this.synchronizeSubscriptions(
      this.eventBus
        .getAvailableCapabilities()
        .events,
    )

    return () =>
      this.stop()
  }

  stop(): void {
    this.stopCatalogSubscription?.()

    this.stopCatalogSubscription =
      null

    for (
      const unsubscribe
      of this.eventSubscriptions
        .values()
    ) {
      unsubscribe()
    }

    this.eventSubscriptions.clear()
  }

  private synchronizeSubscriptions(
    events:
      RegisteredEventDefinition[],
  ): void {
    const availableIds =
      new Set(
        events.map(
          (event) =>
            event.id,
        ),
      )

    for (
      const [
        eventId,
        unsubscribe,
      ]
      of this.eventSubscriptions
    ) {
      if (
        availableIds.has(
          eventId,
        )
      ) {
        continue
      }

      unsubscribe()

      this.eventSubscriptions.delete(
        eventId,
      )
    }

    for (
      const event
      of events
    ) {
      if (
        this.eventSubscriptions.has(
          event.id,
        )
      ) {
        continue
      }

      const unsubscribe =
        this.eventBus.subscribe(
          event.id,
          (message) => {
            void this.handleEvent(
              message,
            )
          },
        )

      this.eventSubscriptions.set(
        event.id,
        unsubscribe,
      )
    }
  }

  private async handleEvent(
    message:
      HostEventMessage,
  ): Promise<void> {
    const project =
      this.getProject()

    if (!project) {
      return
    }

    const controlIds =
      new Set<string>()

    for (
      const reaction
      of project.reactions
    ) {
      if (
        !reactionMatches(
          reaction.trigger,
          message.type,
          message.payload,
        )
      ) {
        continue
      }

      if (
        reaction.effect.type ===
        'execute-control'
      ) {
        controlIds.add(
          reaction.effect.controlId,
        )
      }
    }

    for (
      const controlId
      of controlIds
    ) {
      await this.executeCommand(
        'Equipment.ExecuteControl',
        {
          controlId,

          sourceModuleId:
            message.sourceModuleId,

          eventPayload:
            message.payload,
        },
      )
    }
  }
}

export const equipmentActionManager =
  new EquipmentActionManager(
    moduleEventBus,
  )