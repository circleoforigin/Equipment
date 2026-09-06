import './App.css'

import {
  useEffect,
  useState,
} from 'react'

import type {
  ProjectLoadAcceptedPayload,
  ProjectLoadFailedPayload,
  ProjectLoadedPayload,
  ProjectLoadRequest,
} from '@settingforge/module-sdk'

import MenuBar from './components/MenuBar'
import DiscoveryDialog from './discovery/DiscoveryDialog'
import NewProjectDialog from './projects/NewProjectDialog'

import {
  useDeviceRegistry,
} from './devices/useDeviceRegistry'

import type {
  EquipmentProject,
} from './models/Project'

import {
  projectRepository,
} from './projects/ProjectRepository'

import {
  moduleEventBus,
} from './host/ModuleBus'

import {
  announceEquipmentReady,
} from './host/ModulePresence'

import DeviceRegistryDialog from './devices/DeviceRegistryDialog'

function App() {
  const [
    isDiscoveryOpen,
    setIsDiscoveryOpen,
  ] = useState(false)

  const [
  isNewProjectOpen,
  setIsNewProjectOpen,
] = useState(false)

const [
  isDeviceRegistryOpen,
  setIsDeviceRegistryOpen,
] = useState(false)

  const [
    activeProject,
    setActiveProject,
  ] = useState<EquipmentProject | null>(
    null,
  )

  const [
    projectDirty,
    setProjectDirty,
  ] = useState(false)

  const {
    devices,
    isLoading,
    error,
    reload,
    removeDevice,
  } = useDeviceRegistry()

  /*
   * ------------------------------------------------------
   * Module presence
   * ------------------------------------------------------
   */

  useEffect(() => {
    announceEquipmentReady()
  }, [])

  /*
   * ------------------------------------------------------
   * SettingForge Project contract
   * ------------------------------------------------------
   */

  useEffect(() => {
    const unregisterStatus =
      moduleEventBus.registerRequestHandler(
        'project.status',
        () => ({
          projectId:
            activeProject?.id,

          projectName:
            activeProject?.name,

          dirty:
            projectDirty,
        }),
      )

    const unregisterLoad =
      moduleEventBus.registerRequestHandler(
        'project.load',
        async (request) => {
          const payload =
            request.payload as
              | Partial<ProjectLoadRequest>
              | undefined

          if (
            !payload?.projectId ||
            !payload.loadId
          ) {
            throw new Error(
              'project.load requires projectId and loadId.',
            )
          }

          const project =
            await projectRepository
              .loadProject(
                payload.projectId,
              )

          if (!project) {
            throw new Error(
              `Project "${payload.projectId}" was not found.`,
            )
          }

          const projectId =
            project.id

          const loadId =
            payload.loadId

          /*
           * Accept the host request immediately,
           * then report restoration completion
           * separately.
           */
          void Promise.resolve()
            .then(() => {
              loadProjectIntoWorkspace(
                project,
              )

              const loaded:
                ProjectLoadedPayload = {
                  projectId,
                  loadId,
                }

              moduleEventBus.emit(
                'project.loaded',
                loaded,
              )
            })
            .catch(
              (loadError: unknown) => {
                const failed:
                  ProjectLoadFailedPayload = {
                    projectId,
                    loadId,

                    error:
                      loadError
                        instanceof Error
                        ? loadError.message
                        : 'Project restoration failed.',
                  }

                moduleEventBus.emit(
                  'project.loadFailed',
                  failed,
                )
              },
            )

          const accepted:
            ProjectLoadAcceptedPayload = {
              accepted: true,
              projectId,
              loadId,
            }

          return accepted
        },
      )

    const unregisterSave =
      moduleEventBus.registerRequestHandler(
        'project.save',
        async () => {
          if (!activeProject) {
            return {
              saved: false,
              projectId: undefined,
            }
          }

          const saved =
            await saveActiveProject()

          if (!saved) {
            throw new Error(
              'Unable to save the active project.',
            )
          }

          return {
            saved: true,
            projectId:
              activeProject.id,
          }
        },
      )

    const unregisterClose =
      moduleEventBus.registerRequestHandler(
        'project.close',
        (request) => {
          const payload =
            request.payload as
              | {
                  discardChanges?: boolean
                }
              | undefined

          if (
            projectDirty &&
            !payload?.discardChanges
          ) {
            throw new Error(
              'Project has unsaved changes.',
            )
          }

          closeProject()

          return {
            closed: true,
          }
        },
      )

    return () => {
      unregisterStatus()
      unregisterLoad()
      unregisterSave()
      unregisterClose()
    }
  }, [
    activeProject,
    projectDirty,
  ])

  /*
   * ------------------------------------------------------
   * Project helpers
   * ------------------------------------------------------
   */

  function loadProjectIntoWorkspace(
    project: EquipmentProject,
  ) {
    setActiveProject(project)
    setProjectDirty(false)
  }

  function closeProject() {
    setActiveProject(null)
    setProjectDirty(false)
  }

  async function saveActiveProject():
    Promise<boolean> {
    if (!activeProject) {
      return false
    }

    const projectToSave:
      EquipmentProject = {
        ...activeProject,

        updatedAt:
          new Date().toISOString(),
      }

    try {
      await projectRepository
        .saveProject(
          projectToSave,
        )

      setActiveProject(
        projectToSave,
      )

      setProjectDirty(false)

      return true
    } catch (saveError) {
      console.error(
        '[Equipment] Unable to save project.',
        saveError,
      )

      window.alert(
        'Unable to save the Equipment project.',
      )

      return false
    }
  }

  async function confirmReplaceActiveProject():
    Promise<boolean> {
    if (
      !activeProject ||
      !projectDirty
    ) {
      return true
    }

    return window.confirm(
      `Project "${activeProject.name}" has unsaved changes.\n\nDiscard those changes and continue?`,
    )
  }

  /*
   * ------------------------------------------------------
   * Project menu actions
   * ------------------------------------------------------
   */

  async function handleNewProject() {
  const canContinue =
    await confirmReplaceActiveProject()

  if (!canContinue) {
    return
  }

  setIsNewProjectOpen(true)
}

async function createProject(
  name: string,
) {
  const now =
    new Date().toISOString()

  const project:
    EquipmentProject = {
      id:
        crypto.randomUUID(),

      name,

      controlIds: [],

      reactions: [],

      createdAt:
        now,

      updatedAt:
        now,
    }

  try {
    await projectRepository
      .saveProject(project)

    loadProjectIntoWorkspace(
      project,
    )
  } catch (createError) {
    console.error(
      '[Equipment] Unable to create project.',
      createError,
    )

    throw createError
  }
}

  async function handleLoadProject() {
    const canContinue =
      await confirmReplaceActiveProject()

    if (!canContinue) {
      return
    }

    try {
      const projects =
        await projectRepository
          .loadProjects()

      if (projects.length === 0) {
        window.alert(
          'No Equipment projects have been saved yet.',
        )

        return
      }

      const sortedProjects =
        [...projects].sort(
          (left, right) =>
            left.name.localeCompare(
              right.name,
            ),
        )

      const choices =
        sortedProjects
          .map(
            (project, index) =>
              `${index + 1}. ${project.name}`,
          )
          .join('\n')

      const selection =
        window.prompt(
          `Choose a project:\n\n${choices}\n\nEnter the project number:`,
        )

      if (selection === null) {
        return
      }

      const selectedIndex =
        Number.parseInt(
          selection.trim(),
          10,
        ) - 1

      const selectedProject =
        sortedProjects[
          selectedIndex
        ]

      if (!selectedProject) {
        window.alert(
          'That project selection is not valid.',
        )

        return
      }

      const project =
        await projectRepository
          .loadProject(
            selectedProject.id,
          )

      if (!project) {
        window.alert(
          'The selected Equipment project could not be found.',
        )

        return
      }

      loadProjectIntoWorkspace(
        project,
      )
    } catch (loadError) {
      console.error(
        '[Equipment] Unable to load projects.',
        loadError,
      )

      window.alert(
        'Unable to load Equipment projects.',
      )
    }
  }

  function handleSaveProject() {
    void saveActiveProject()
  }

  async function handleCloseProject() {
    if (!activeProject) {
      return
    }

    if (projectDirty) {
      const discard =
        window.confirm(
          `Project "${activeProject.name}" has unsaved changes.\n\nClose it and discard those changes?`,
        )

      if (!discard) {
        return
      }
    }

    closeProject()
  }

  async function handleDeleteProject() {
    if (!activeProject) {
      return
    }

    const project =
      activeProject

    const confirmed =
      window.confirm(
        `Delete Equipment project "${project.name}"?\n\nThis will delete only the Project. It will NOT delete Rooms, registered Devices, or device authorizations.`,
      )

    if (!confirmed) {
      return
    }

    try {
      const deleted =
        await projectRepository
          .deleteProject(
            project.id,
          )

      if (!deleted) {
        window.alert(
          'The Equipment project could not be deleted.',
        )

        return
      }

      closeProject()
    } catch (deleteError) {
      console.error(
        '[Equipment] Unable to delete project.',
        deleteError,
      )

      window.alert(
        'Unable to delete the Equipment project.',
      )
    }
  }

  /*
   * ------------------------------------------------------
   * Device Registry
   * ------------------------------------------------------
   */

  function openDiscovery() {
    setIsDiscoveryOpen(true)
  }

  function closeDiscovery() {
    setIsDiscoveryOpen(false)

    void reload()
  }

  async function handleRemoveDevice(
    id: string,
    name: string,
  ) {
    const confirmed =
      window.confirm(
        `Remove "${name}" from Equipment?`,
      )

    if (!confirmed) {
      return
    }

    try {
      await removeDevice(id)
    } catch (removeError) {
      console.error(
        '[Equipment] Failed to remove device.',
        removeError,
      )

      window.alert(
        removeError instanceof Error
          ? removeError.message
          : 'Unable to remove device.',
      )
    }
  }

  function showDeviceRegistry() {
    setIsDeviceRegistryOpen(true)
  }

  /*
   * ------------------------------------------------------
   * UI
   * ------------------------------------------------------
   */

  return (
    <div className="equipment-app">
      <MenuBar
        projectName={
          activeProject?.name
        }

        onNewProject={() => {
          void handleNewProject()
        }}

        onLoadProject={() => {
          void handleLoadProject()
        }}

        onSaveProject={
          handleSaveProject
        }

        onCloseProject={() => {
          void handleCloseProject()
        }}

        onDeleteProject={() => {
          void handleDeleteProject()
        }}

        onDiscoverDevices={
          openDiscovery
        }

        onShowDeviceRegistry={
          showDeviceRegistry
        }
      />

      <main className="equipment-workspace">
  {!activeProject ? (
    <div className="equipment-empty-workspace">
      <h2>
        No Project Loaded
      </h2>

      <p>
        Create or load a project to get started.
      </p>
    </div>
  ) : (
    <div className="equipment-project-workspace" />
  )}
</main>

      <NewProjectDialog
  isOpen={
    isNewProjectOpen
  }

  onClose={() =>
    setIsNewProjectOpen(false)
  }

  onCreate={
    createProject
  }
/>

      <DiscoveryDialog
        isOpen={isDiscoveryOpen}
        onClose={closeDiscovery}
      />

      <DeviceRegistryDialog
  isOpen={
    isDeviceRegistryOpen
  }

  devices={
    devices
  }

  isLoading={
    isLoading
  }

  error={
    error
  }

  onClose={() =>
    setIsDeviceRegistryOpen(false)
  }

  onRemoveDevice={(
    id,
    name,
  ) => {
    void handleRemoveDevice(
      id,
      name,
    )
  }}
/>
    </div>   
  )
}

export default App