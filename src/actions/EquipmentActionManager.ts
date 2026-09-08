import {
  reactionMatches,
} from '@settingforge/module-sdk'

import type {
  HostEventMessage,
  ModuleEventBus,
  RegisteredActionDefinition,
} from '@settingforge/module-sdk'

import type {
  EquipmentProject,
} from '../models/Project'

import {
  moduleEventBus,
} from '../host/ModuleBus'

type ProjectProvider =
  () => EquipmentProject | null

type ControlExecutor =
  (controlId: string) => Promise<void>

export class EquipmentActionManager {
  private readonly eventBus:
    ModuleEventBus

  private readonly actionSubscriptions =
    new Map<string, () => void>()

  private stopCatalogSubscription:
    (() => void) | null = null

  private getProject:
    ProjectProvider = () => null

  private executeControl:
    ControlExecutor = async () => undefined

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
      this.eventBus.onActionsChanged(
        (actions) =>
          this.synchronizeSubscriptions(
            actions,
          ),
      )

    this.synchronizeSubscriptions(
      this.eventBus.getAvailableActions(),
    )

    return () => this.stop()
  }

  stop(): void {
    this.stopCatalogSubscription?.()

    this.stopCatalogSubscription =
      null

    for (
      const unsubscribe
      of this.actionSubscriptions.values()
    ) {
      unsubscribe()
    }

    this.actionSubscriptions.clear()
  }

  private synchronizeSubscriptions(
    actions: RegisteredActionDefinition[],
  ): void {
    const availableIds =
      new Set(
        actions.map(
          (action) => action.id,
        ),
      )

    for (
      const [
        actionId,
        unsubscribe,
      ]
      of this.actionSubscriptions
    ) {
      if (
        availableIds.has(actionId)
      ) {
        continue
      }

      unsubscribe()

      this.actionSubscriptions.delete(
        actionId,
      )
    }

    for (const action of actions) {
      if (
        this.actionSubscriptions.has(
          action.id,
        )
      ) {
        continue
      }

      const unsubscribe =
        this.eventBus.subscribe(
          action.id,
          (message) => {
            void this.handleAction(
              message,
            )
          },
        )

      this.actionSubscriptions.set(
        action.id,
        unsubscribe,
      )
    }
  }

  private async handleAction(
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

    for (
      const controlId
      of controlIds
    ) {
      await this.executeControl(
        controlId,
      )
    }
  }
}

export const equipmentActionManager =
  new EquipmentActionManager(
    moduleEventBus,
  )