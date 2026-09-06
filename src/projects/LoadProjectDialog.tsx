import type {
  EquipmentProject,
} from '../models/Project'

interface LoadProjectDialogProps {
  isOpen: boolean
  projects: EquipmentProject[]
  onClose: () => void
  onLoad: (
    projectId: string,
  ) => Promise<void>
}

function LoadProjectDialog({
  isOpen,
  projects,
  onClose,
  onLoad,
}: LoadProjectDialogProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h2>
          Load Project
        </h2>

        {projects.length === 0 ? (
          <p className="project-picker-empty">
            No saved projects.
          </p>
        ) : (
          <div className="project-picker-list">
            {projects.map(
              (project) => (
                <button
                  key={project.id}
                  type="button"
                  className="project-picker-item"
                  onClick={() =>
                    void onLoad(
                      project.id,
                    )
                  }
                >
                  {project.name}
                </button>
              ),
            )}
          </div>
        )}

        <div className="dialog-buttons">
          <button
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoadProjectDialog