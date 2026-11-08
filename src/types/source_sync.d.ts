declare namespace LX {
  namespace Sync {
    namespace Source {
      interface SourceUpdateData {
        url: string
        md5: string
        updateTime: number
        encrypted: boolean
      }

      interface ActionSource {
        action: 'source_update'
        data: SourceUpdateData
      }
    }
  }
}
