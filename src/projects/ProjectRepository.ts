import type {
  EquipmentProject,
} from '../models/Project'

import {
  hostedCollectionRepository,
} from '../host/HostedCollectionRepository'

const PROJECTS_COLLECTION =
  'projects'

function normalizeProject(
  project: EquipmentProject,
): EquipmentProject {
  return {
    ...project,

    roomIds:
      Array.isArray(
        project.roomIds,
      )
        ? project.roomIds
        : [],

    controlIds:
      Array.isArray(
        project.controlIds,
      )
        ? project.controlIds
        : [],

    reactions:
      Array.isArray(
        project.reactions,
      )
        ? project.reactions
        : [],
  }
}

export class ProjectRepository {
  async loadProjects():
    Promise<EquipmentProject[]> {
    const projects =
      await hostedCollectionRepository
        .loadAll<EquipmentProject>(
          PROJECTS_COLLECTION,
        )

    return Array.isArray(projects)
      ? projects.map(
          normalizeProject,
        )
      : []
  }

  async loadProject(
    projectId: string,
  ): Promise<EquipmentProject | null> {
    const project =
      await hostedCollectionRepository
        .load<EquipmentProject>(
          PROJECTS_COLLECTION,
          projectId,
        )

    return project
      ? normalizeProject(project)
      : null
  }

  async saveProject(
    project: EquipmentProject,
  ): Promise<void> {
    await hostedCollectionRepository.save(
      PROJECTS_COLLECTION,
      project.id,
      project,
    )
  }

  async deleteProject(
    projectId: string,
  ): Promise<boolean> {
    return hostedCollectionRepository.delete(
      PROJECTS_COLLECTION,
      projectId,
    )
  }
}

export const projectRepository =
  new ProjectRepository()