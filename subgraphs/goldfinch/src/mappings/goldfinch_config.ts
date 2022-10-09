import {GoListed, NoListed} from "../../generated/GoldfinchConfig/GoldfinchConfig"
import {getOrInitUser} from "../entities/user"

export function handleGoListed(event: GoListed): void {
  const user = getOrInitUser(event.params.member)
  user.isGoListed = true
  user.save()
}

export function handleNoListed(event: NoListed): void {
  const user = getOrInitUser(event.params.member)
  user.isGoListed = false
  user.save()
}
