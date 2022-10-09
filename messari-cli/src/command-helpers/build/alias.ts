export function getServiceAlias(service): string {
  switch (service) {
    case 'subgraph-studio':
    case 'studio':
    case 's':
    case 'decentralized-network':
    case 'd':
      return 'subgraph-studio'
    case 'cronos-portal':
    case 'cronos':
    case 'c':
      return 'cronos-portal'
    case 'hosted-service':
    case 'hosted':
    case 'h':
      return 'hosted-service'
    default:
      return service
  }
}

export function getScopeAlias(scope): string {
  switch (scope) {
    case 'single':
    case 's':
      return 'single'
    case 'protocol':
    case 'p':
      return 'protocol'
    case 'base':
    case 'b':
      return 'base'
    default:
      return scope
  }
}
