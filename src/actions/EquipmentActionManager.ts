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

export interface EquipmentControlExecutionContext {
  sourceModuleId: string
  payload: unknown
}

type ControlExecutor =
  (
    controlId: string,
    context: EquipmentControlExecutionContext,
  ) => Promise<void>

export class EquipmentActionManager {
  private readonly eventBus:
    ModuleEventBus

  private readonly eventSubscriptions =
    new Map<string, () => void>()

  private stopCatalogSubscription:
    (() => void) | null = null

  private getProject:
    ProjectProvider = () => null

  private executeControl:
    ControlExecutor =
      async () => undefined

  constructor(
    eventBus: ModuleEventBus,
  ) {
    this.eventBus = eventBus
  }

  start(
    getProject: ProjectProvider,
    executeControl: ControlExecutor,
  ): () => void {
    this.stop()

    this.getProject =
      getProject

    this.executeControl =
      executeControl

    this.stopCatalogSubscription =
      this.eventBus.onCapabilitiesChanged(
        (capabilities) =>
          this.synchronizeSubscriptions(
            capabilities.events,
          ),
      )

    this.synchronizeSubscriptions(
      this.eventBus.getAvailableCapabilities()
        .events,
    )

    return () => this.stop()
  }

  stop(): void {
    this.stopCatalogSubscription?.()

    this.stopCatalogSubscription =
      null

    for (
      const unsubscribe
      of this.eventSubscriptions.values()
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
          (event) => event.id,
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
        availableIds.has(eventId)
      ) {
        continue
      }

      unsubscribe()

      this.eventSubscriptions.delete(
        eventId,
      )
    }

    for (const event of events) {
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
    message: HostEventMessage,
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

    const context:
      EquipmentControlExecutionContext = {
        sourceModuleId:
          message.sourceModuleId,

        payload:
          message.payload,
      }

    for (
      const controlId
      of controlIds
    ) {
      await this.executeControl(
        controlId,
        context,
      )
    }
  }
}

export const equipmentActionManager =
  new EquipmentActionManager(
    moduleEventBus,
  )