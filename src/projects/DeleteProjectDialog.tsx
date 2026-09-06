interface DeleteProjectDialogProps {
  isOpen: boolean
  projectName?: string
  isDeleting: boolean
  onCancel: () => void
  onDelete: () => Promise<void>
}

function DeleteProjectDialog({
  isOpen,
  projectName,
  isDeleting,
  onCancel,
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
          Delete
          {' '}
          <strong>
            {projectName ?? 'this project'}
          </strong>
          ?
        </p>

        <p>
          This will delete only the Equipment Project.
          Rooms, registered Devices, and device
          authorizations will not be deleted.
        </p>

        <div className="dialog-buttons">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={() =>
              void onDelete()
            }
          >
            {isDeleting
              ? 'Deleting...'
              : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteProjectDialog