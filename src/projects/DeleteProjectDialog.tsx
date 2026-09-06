import type {
  EquipmentProject,
} from '../models/Project'

interface DeleteProjectDialogProps {
  isOpen: boolean
  projects: EquipmentProject[]
  onClose: () => void
  onDelete: (
    project: EquipmentProject,
  ) => Promise<void>
}

function DeleteProjectDialog({
  isOpen,
  projects,
  onClose,
  onDelete,
}: DeleteProjectDialogProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h2>
          Delete Project
        </h2>

        <p>
          Select a project to delete.
        </p>

        <div className="project-picker-list">
          {projects.length === 0 ? (
            <p>
              No projects available to delete.
            </p>
          ) : (
            projects.map(
              (project) => (
                <button
                  key={project.id}
                  type="button"
                  className="project-picker-item"
                  onClick={() =>
                    void onDelete(
                      project,
                    )
                  }
                >
                  {project.name}
                </button>
              ),
            )
          )}
        </div>

        <div className="dialog-buttons">
          <button
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteProjectDialog