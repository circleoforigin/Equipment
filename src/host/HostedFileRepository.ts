import {
  moduleEventBus,
} from './ModuleBus'

export class HostedFileRepository {
  async readFromModule(
    ownerModuleId: string,
    folder: string,
    fileName: string,
  ): Promise<number[] | null> {
    return moduleEventBus.request<
      number[] | null
    >(
      'file.read',
      {
        ownerModuleId,
        folder,
        fileName,
      },
    )
  }
}

export const hostedFileRepository =
  new HostedFileRepository()