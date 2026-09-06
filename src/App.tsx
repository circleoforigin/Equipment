import './App.css'

import {
  useEffect,
  useRef,
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
import LoadProjectDialog from './projects/LoadProjectDialog'
import UnsavedChangesDialog from './projects/UnsavedChangesDialog'
import DeleteProjectDialog from './projects/DeleteProjectDialog'

import NewRoomDialog, {
  type NewRoomData,
} from './components/NewRoomDialog'

import type {
  EquipmentRoom,
} from './models/Room'

import {
  roomRepository,
} from './rooms/RoomRepository'

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
  isLoadProjectOpen,
  setIsLoadProjectOpen,
] = useState(false)

const [
  savedProjects,
  setSavedProjects,
] = useState<EquipmentProject[]>([])

const [
  isUnsavedChangesOpen,
  setIsUnsavedChangesOpen,
] = useState(false)

const [
  isDeleteProjectOpen,
  setIsDeleteProjectOpen,
] = useState(false)

const [
  isSavingBeforeAction,
  setIsSavingBeforeAction,
] = useState(false)

const [
  isNewRoomOpen,
  setIsNewRoomOpen,
] = useState(false)

const pendingProjectActionRef =
  useRef<(() => void) | null>(
    null,
  )

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

  const deletableProjects =
      savedProjects.filter(
        (project) =>
          project.id !==
          activeProject?.id,
      )

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

  function requestProjectAction(
  action: () => void,
) {
  if (
    !activeProject ||
    !projectDirty
  ) {
    action()
    return
  }

  pendingProjectActionRef.current =
    action

  setIsUnsavedChangesOpen(
    true,
  )
}

function cancelPendingProjectAction() {
  pendingProjectActionRef.current =
    null

  setIsUnsavedChangesOpen(
    false,
  )
}

function discardAndContinue() {
  const action =
    pendingProjectActionRef.current

  pendingProjectActionRef.current =
    null

  setIsUnsavedChangesOpen(
    false,
  )

  action?.()
}

async function saveAndContinue() {
  if (isSavingBeforeAction) {
    return
  }

  setIsSavingBeforeAction(
    true,
  )

  try {
    const saved =
      await saveActiveProject()

    if (!saved) {
      return
    }

    const action =
      pendingProjectActionRef.current

    pendingProjectActionRef.current =
      null

    setIsUnsavedChangesOpen(
      false,
    )

    action?.()
  } finally {
    setIsSavingBeforeAction(
      false,
    )
  }
}

  /*
   * ------------------------------------------------------
   * Project menu actions
   * ------------------------------------------------------
   */

  function handleNewProject() {
  requestProjectAction(
    () => {
      setIsNewProjectOpen(
        true,
      )
    },
  )
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

function handleLoadProject() {
  requestProjectAction(
    () => {
      void openLoadProjectDialog()
    },
  )
}

  async function openLoadProjectDialog() {
  try {
    const projects =
      await projectRepository
        .loadProjects()

    const sortedProjects =
      [...projects].sort(
        (left, right) =>
          left.name.localeCompare(
            right.name,
          ),
      )

    setSavedProjects(
      sortedProjects,
    )

    setIsLoadProjectOpen(
      true,
    )
  } catch (loadError) {
    console.error(
      '[Equipment] Unable to load projects.',
      loadError,
    )
  }
}

async function loadSelectedProject(
  projectId: string,
) {
  try {
    const project =
      await projectRepository
        .loadProject(
          projectId,
        )

    if (!project) {
      console.error(
        '[Equipment] Selected project was not found.',
      )

      return
    }

    loadProjectIntoWorkspace(
      project,
    )

    setIsLoadProjectOpen(
      false,
    )
  } catch (loadError) {
    console.error(
      '[Equipment] Unable to load project.',
      loadError,
    )
  }
}

  function handleSaveProject() {
    void saveActiveProject()
  }

  function handleCloseProject() {
  if (!activeProject) {
    return
  }

  requestProjectAction(
    closeProject,
  )
}

 async function handleDeleteProject() {
  try {
    const projects =
      await projectRepository
        .loadProjects()

    const sortedProjects =
      [...projects].sort(
        (left, right) =>
          left.name.localeCompare(
            right.name,
          ),
      )

    setSavedProjects(
      sortedProjects,
    )

    setIsDeleteProjectOpen(
      true,
    )
  } catch (loadError) {
    console.error(
      '[Equipment] Unable to load projects for deletion.',
      loadError,
    )
  }
}

async function handleDeleteSelectedProject(
  project: EquipmentProject,
) {
  if (
    project.id ===
    activeProject?.id
  ) {
    return
  }

  try {
    const deleted =
      await projectRepository
        .deleteProject(
          project.id,
        )

    if (!deleted) {
      console.error(
        '[Equipment] Project could not be deleted.',
      )

      return
    }

    const projects =
      await projectRepository
        .loadProjects()

    const sortedProjects =
      [...projects].sort(
        (left, right) =>
          left.name.localeCompare(
            right.name,
          ),
      )

    setSavedProjects(
      sortedProjects,
    )
  } catch (deleteError) {
    console.error(
      '[Equipment] Unable to delete project.',
      deleteError,
    )
  }
}

async function createRoom(
  data: NewRoomData,
) {
  const now =
    new Date().toISOString()

  const isSquare =
    data.shape === 'square'

  const room: EquipmentRoom = {
    id: crypto.randomUUID(),

    name: data.name,

    width:
      isSquare ? 1 : 1.5,

    height: 1,

    devices: [],

    createdAt: now,
    updatedAt: now,
  }

  try {
    await roomRepository.saveRoom(
      room,
    )

    setIsNewRoomOpen(false)
  } catch (createError) {
    console.error(
      '[Equipment] Unable to create Room.',
      createError,
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

        onManageRooms={() => {
          // Room Manager comes next.
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
  <div className="module-identifier">
    Equipment
  </div>

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

{isNewRoomOpen && (
  <NewRoomDialog
    onCancel={() =>
      setIsNewRoomOpen(false)
    }

    onCreate={createRoom}
  />
)}

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

      <LoadProjectDialog
        isOpen={
          isLoadProjectOpen
        }

        projects={
          savedProjects
        }

        onClose={() =>
          setIsLoadProjectOpen(false)
        }

        onLoad={
          loadSelectedProject
        }
      />

      <UnsavedChangesDialog
        isOpen={
          isUnsavedChangesOpen
        }

        projectName={
          activeProject?.name
        }

        isSaving={
          isSavingBeforeAction
        }

        onCancel={
          cancelPendingProjectAction
        }

        onDiscard={
          discardAndContinue
        }

        onSave={
          saveAndContinue
        }
      />

      <DeleteProjectDialog
  isOpen={
    isDeleteProjectOpen
  }

  projects={
    deletableProjects
  }

  onClose={() =>
    setIsDeleteProjectOpen(false)
  }

  onDelete={
    handleDeleteSelectedProject
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