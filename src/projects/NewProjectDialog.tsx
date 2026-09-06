import {
  useEffect,
  useState,
} from 'react'

interface NewProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (
    name: string,
  ) => Promise<void>
}

function NewProjectDialog({
  isOpen,
  onClose,
  onCreate,
}: NewProjectDialogProps) {
  const [
    projectName,
    setProjectName,
  ] = useState('')

  const [
    isCreating,
    setIsCreating,
  ] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setProjectName('')
      setIsCreating(false)
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  async function handleCreate() {
    const trimmedName =
      projectName.trim()

    if (
      !trimmedName ||
      isCreating
    ) {
      return
    }

    setIsCreating(true)

    try {
      await onCreate(
        trimmedName,
      )

      onClose()
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h2>
          New Project
        </h2>

        <input
          type="text"
          placeholder="Project name"
          value={projectName}
          disabled={isCreating}
          onChange={(event) =>
            setProjectName(
              event.target.value,
            )
          }
          onKeyDown={(event) => {
            if (
              event.key === 'Enter'
            ) {
              void handleCreate()
            }
          }}
          autoFocus
        />

        <div className="dialog-buttons">
          <button
            type="button"
            disabled={isCreating}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              !projectName.trim() ||
              isCreating
            }
            onClick={() =>
              void handleCreate()
            }
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewProjectDialog