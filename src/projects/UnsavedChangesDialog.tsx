interface UnsavedChangesDialogProps {
  isOpen: boolean
  projectName?: string
  isSaving: boolean
  onCancel: () => void
  onDiscard: () => void
  onSave: () => Promise<void>
}

function UnsavedChangesDialog({
  isOpen,
  projectName,
  isSaving,
  onCancel,
  onDiscard,
  onSave,
}: UnsavedChangesDialogProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h2>
          Unsaved Changes
        </h2>

        <p>
          {projectName
            ? `Save changes to "${projectName}" before continuing?`
            : 'Save changes before continuing?'}
        </p>

        <div className="dialog-buttons">
          <button
            type="button"
            disabled={isSaving}
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={onDiscard}
          >
            Don't Save
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() =>
              void onSave()
            }
          >
            {isSaving
              ? 'Saving...'
              : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UnsavedChangesDialog